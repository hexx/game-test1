import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHAR_ORDER } from '../src/game/characters';
import { RECIPES } from '../src/game/ingredients';
import { PROFILES, PROFILE_ORDER, isMet, secretText, usualText } from '../src/game/profiles';
import { createSave } from '../src/game/state';
import type { CharId, SaveData } from '../src/game/types';

/**
 * 登場人物名鑑のデータ整合性。
 * 「解放条件に使っているフラグが、シナリオで実際に立つか」まで機械的に確かめる。
 */

function scriptSources(): string {
  const dir = join(process.cwd(), 'src/game');
  const files = [
    ...readdirSync(join(dir, 'script')).map((f) => join(dir, 'script', f)),
    join(dir, 'engine.ts'),
  ];
  return files.map((f) => readFileSync(f, 'utf8')).join('\n');
}

/** secret.when が参照しているフラグ名を、Proxy で記録して取り出す */
function accessedFlags(when: (s: SaveData) => boolean): string[] {
  const keys = new Set<string>();
  const flags = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === 'string') keys.add(prop);
        return undefined;
      },
      has: () => true,
    },
  );
  const save = { ...createSave(), flags } as unknown as SaveData;
  when(save);
  return [...keys];
}

describe('登場人物名鑑', () => {
  it('全員ぶんの紹介が用意されている', () => {
    for (const who of CHAR_ORDER) {
      const profile = PROFILES[who];
      expect(profile, `${who} の紹介がない`).toBeTruthy();
      expect(profile.catch.length).toBeGreaterThan(0);
      expect(profile.debut.length).toBeGreaterThan(0);
      expect(profile.meta.length).toBeGreaterThan(0);
      expect(profile.lines.length).toBeGreaterThanOrEqual(2);
      for (const line of profile.lines) expect(line.text.length).toBeGreaterThan(0);
    }
  });

  it('名鑑の並び順が全員をちょうど1回ずつ含む', () => {
    expect([...PROFILE_ORDER].sort()).toEqual([...CHAR_ORDER].sort());
    expect(new Set(PROFILE_ORDER).size).toBe(PROFILE_ORDER.length);
  });

  it('「いつもの一杯」は実在するレシピを指す', () => {
    const ids = new Set(RECIPES.map((r) => r.id));
    for (const who of PROFILE_ORDER) {
      const recipeId = PROFILES[who].usual.recipeId;
      if (recipeId) expect(ids.has(recipeId), `${who} の usual が不明: ${recipeId}`).toBe(true);
    }
  });

  it('解放条件のフラグは、シナリオかエンジンで実際に立つ', () => {
    const source = scriptSources();
    for (const who of PROFILE_ORDER) {
      for (const flag of accessedFlags(PROFILES[who].secret.when)) {
        if (flag.startsWith('__')) continue; // 内部用（保存メタ情報）
        expect(source.includes(flag), `${who} の解放条件 ${flag} がシナリオに見つからない`).toBe(true);
      }
    }
  });

  it('未登場のあいだは、いつもの一杯も秘密も伏せられる', () => {
    const save = createSave();
    for (const who of PROFILE_ORDER) {
      expect(isMet(save, who)).toBe(false);
      expect(usualText(PROFILES[who], save, false)).toContain('？？？');
      expect(secretText(PROFILES[who], save, false)).toBeNull();
    }
  });

  it('フラグが立っていても、出会っていなければ秘密は伏せる', () => {
    const save = createSave();
    save.flags.sera_home = true; // 進行フラグだけがある不整合なセーブ
    expect(secretText(PROFILES.sera, save, false)).toBeNull();
    expect(secretText(PROFILES.sera, save, true)).toContain('村の家');
  });

  it('信頼度が上がると秘密が読めるようになる', () => {
    const save = createSave();
    save.trust.sera = 6;
    save.flags.sera_home = true;
    expect(secretText(PROFILES.sera, save, isMet(save, 'sera'))).toContain('村の家');
    expect(isMet(save, 'sera')).toBe(true); // 旧セーブ互換（trust から推定）
  });

  it('信頼度0の人を「出会った」と数えない（旧セーブの復元）', async () => {
    const { importSave, exportSave } = await import('../src/game/state');
    const legacy = { ...createSave('テスト'), trust: { yuki: 0, luca: 2 }, met: undefined };
    const restored = importSave(exportSave(legacy as unknown as SaveData));
    expect(restored?.met).toEqual(['luca']);
  });

  it('壊れた材料ID（toString など）でも落ちない', () => {
    const save = createSave();
    save.met = ['mira'];
    save.flags.mira_favorite = 'toString@iced';
    expect(() => usualText(PROFILES.mira, save, true)).not.toThrow();
    expect(usualText(PROFILES.mira, save, true)).toContain('まだ決まっていない');
  });

  it('ミラの「いつもの一杯」は、プレイヤーが淹れた一杯になる', () => {
    const save = createSave();
    save.met = ['mira'];
    save.flags.mira_favorite = 'coffee+milk@iced';
    expect(usualText(PROFILES.mira, save, true)).toContain('カフェラテ');
    const empty = createSave();
    empty.met = ['mira'];
    expect(usualText(PROFILES.mira, empty, true)).toContain('まだ決まっていない');
  });
});

describe('セーブデータの互換', () => {
  it('met を持たないセーブは信頼度から復元される', async () => {
    const { importSave, exportSave } = await import('../src/game/state');
    const old = createSave('テスト');
    const legacy = { ...old, trust: { yuki: 3 } as Record<CharId, number>, met: undefined };
    const restored = importSave(exportSave(legacy as unknown as SaveData));
    expect(restored?.met).toContain('yuki');
  });
});