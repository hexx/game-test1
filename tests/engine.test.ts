import { describe, expect, it } from 'vitest';
import { Engine } from '../src/game/engine';
import { createSave } from '../src/game/state';
import type { Chapter, Line } from '../src/game/types';
import { makeDrink } from '../src/game/ingredients';

function chapter(lines: Line[]): Chapter[] {
  return [
    {
      id: 'test',
      title: 'テスト',
      subtitle: 'テスト',
      start: 's1',
      scenes: [
        { id: 's1', title: 'シーン1', lines },
        { id: 's2', title: 'シーン2', lines: [{ t: 'say', who: 'narrator', text: 'シーン2' }] },
        { id: 's3', title: 'シーン3', lines: [{ t: 'say', who: 'narrator', text: '完璧だった' }] },
        { id: 's4', title: 'シーン4', lines: [{ t: 'say', who: 'narrator', text: 'ちがった' }] },
      ],
    },
  ];
}

describe('Engine', () => {
  it('choice のフラグとジャンプが動く', () => {
    const lines: Line[] = [
      { t: 'set', fn: (s) => (s.flags.start = true) },
      {
        t: 'choice',
        options: [{ text: 'A', set: (s) => (s.flags.a = true), to: 's2' }],
      },
    ];
    const engine = new Engine(chapter(lines), createSave());
    let event = engine.next();
    expect(event.type).toBe('choice');
    engine.resolveChoice(0);
    event = engine.next();
    expect(event).toMatchObject({ type: 'say', text: 'シーン2' });
    expect(engine.save.flags.a).toBe(true);
    expect(engine.save.scene).toBe('s2');
  });

  it('order は判定結果に応じてジャンプし、信頼度を上げる', () => {
    const lines: Line[] = [
      {
        t: 'order',
        customer: 'yuki',
        order: {
          kind: 'exact',
          id: 'o1',
          label: 'ミルクとはちみつ',
          ingredients: ['milk', 'honey'],
          temperature: 'hot',
        },
        results: { perfect: 's3', off: 's4' },
      },
    ];
    const engine = new Engine(chapter(lines), createSave());
    expect(engine.next().type).toBe('order');
    const grade = engine.resolveOrder(makeDrink(['milk', 'honey'], 'hot'));
    expect(grade).toBe('perfect');
    expect(engine.next()).toMatchObject({ type: 'say', text: '完璧だった' });
    expect(engine.save.trust.yuki).toBe(2);
    expect(engine.save.drinks).toHaveLength(1);
  });

  it('if の分岐とセーブ位置の復元ができる', () => {
    const lines: Line[] = [
      { t: 'set', fn: (s) => (s.flags.x = true) },
      {
        t: 'if',
        when: (s) => Boolean(s.flags.x),
        then: [
          { t: 'set', fn: (s) => (s.flags.inner = 1) },
          { t: 'say', who: 'narrator', text: '分岐の中' },
        ],
        else: [{ t: 'say', who: 'narrator', text: 'else' }],
      },
      { t: 'say', who: 'narrator', text: '分岐の後' },
    ];
    const save = createSave();
    const engine = new Engine(chapter(lines), save);
    expect(engine.next()).toMatchObject({ type: 'say', text: '分岐の中' });
    expect(save.flags.inner).toBe(1);
    // 深い位置でセーブしたことにする
    engine.persist();
    expect(save.frames.length).toBe(2);
    const resumed = new Engine(chapter(lines), { ...save, frames: save.frames.map((f) => ({ ...f })) });
    expect(resumed.next()).toMatchObject({ type: 'say', text: '分岐の後' });
  });

  it('scene の終わりを検出する', () => {
    const engine = new Engine(chapter([{ t: 'say', who: 'narrator', text: 'ひとつだけ' }]), createSave());
    expect(engine.next().type).toBe('say');
    expect(engine.next().type).toBe('scene-end');
  });
});