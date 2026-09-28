import { describe, expect, it, vi } from 'vitest';
import { Engine } from '../src/game/engine';
import { makeDrink } from '../src/game/ingredients';
import { CHAPTERS } from '../src/game/script';
import { createSave } from '../src/game/state';
import type { Drink, IngredientId, Line, Order } from '../src/game/types';

/** シナリオの構造を検証し、最後まで通しで再生できることを確かめる。 */

function allLines(): Line[] {
  const out: Line[] = [];
  const walk = (lines: Line[]) => {
    for (const line of lines) {
      out.push(line);
      if (line.t === 'if') {
        walk(line.then);
        if (line.else) walk(line.else);
      }
    }
  };
  for (const chapter of CHAPTERS) for (const scene of chapter.scenes) walk(scene.lines);
  return out;
}

function sceneIds(): string[] {
  return CHAPTERS.flatMap((c) => c.scenes.map((s) => s.id));
}

function jumpTargets(): string[] {
  const out: string[] = [];
  for (const line of allLines()) {
    if (line.t === 'jump') out.push(line.to);
    if (line.t === 'choice') for (const o of line.options) if (o.to) out.push(o.to);
    if (line.t === 'order') {
      for (const target of Object.values(line.results)) if (target) out.push(target);
    }
  }
  return out;
}

const BASE_IDS: IngredientId[] = ['coffee', 'tea', 'greenTea', 'chocolate', 'milk'];
const ADD_IDS: IngredientId[] = [
  'honey',
  'cinnamon',
  'ginger',
  'mint',
  'lemon',
  'nuts',
  'caramel',
  'vanilla',
  'chili',
];

function* combos(): Generator<IngredientId[]> {
  for (const b of BASE_IDS) {
    yield [b];
    for (const a of ADD_IDS) {
      yield [b, a];
      for (const a2 of ADD_IDS) {
        if (a === a2) continue;
        yield [b, a, a2];
      }
    }
    yield [b, ...BASE_IDS.filter((x) => x !== b)];
  }
}

/** 注文に対して「いちばん近い一杯」を探す（プレイヤーの理想的な操作の代わり） */
function idealDrink(order: Order): Drink {
  if (order.kind === 'exact') return makeDrink(order.ingredients, order.temperature);
  if (order.kind === 'free') return makeDrink(['milk', 'honey'], 'hot');
  const temp = order.temperature ?? 'hot';
  const axes = Object.keys(order.want) as (keyof typeof order.want)[];
  let best = makeDrink(['milk'], temp);
  let bestDist = Number.POSITIVE_INFINITY;
  for (const combo of combos()) {
    const drink = makeDrink(combo, temp);
    let dist = 0;
    for (const axis of axes) dist += Math.abs(drink.taste[axis] - (order.want[axis] ?? 0));
    dist /= axes.length;
    if (dist < bestDist) {
      bestDist = dist;
      best = drink;
    }
  }
  return best;
}

describe('シナリオ構造', () => {
  it('シーンIDが重複していない', () => {
    const ids = sceneIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ジャンプ先のシーンがすべて存在する', () => {
    const ids = new Set(sceneIds());
    const missing = jumpTargets().filter((t) => !ids.has(t));
    expect(missing).toEqual([]);
  });

  it('各章の開始シーンが存在する', () => {
    for (const chapter of CHAPTERS) {
      expect(chapter.scenes.some((s) => s.id === chapter.start)).toBe(true);
    }
  });

  it('注文の材料指定が実在する材料を使っている', () => {
    const known = new Set([...BASE_IDS, ...ADD_IDS]);
    for (const line of allLines()) {
      if (line.t !== 'order' || typeof line.order === 'function') continue;
      if (line.order.kind !== 'exact') continue;
      for (const id of line.order.ingredients) expect(known.has(id)).toBe(true);
      expect(line.order.ingredients.length).toBeGreaterThan(0);
    }
  });
});

describe('通し再生', () => {
  it('理想的な操作で、最後まで到達してエンディングを迎える', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = new Engine(CHAPTERS, createSave('テスト'));
    const grades: string[] = [];
    let ending: string | null = null;
    let guard = 0;
    let pendingOrder = false;

    while (ending === null && guard < 4000) {
      guard += 1;
      if (pendingOrder) {
        pendingOrder = false;
        const drink = idealDrink(lastOrder!);
        grades.push(engine.resolveOrder(drink));
        continue;
      }
      const event = engine.next();
      switch (event.type) {
        case 'order':
          lastOrder = event.order;
          pendingOrder = true;
          break;
        case 'choice': {
          const index = event.options.findIndex((o) => !o.locked);
          engine.resolveChoice(index < 0 ? 0 : index);
          break;
        }
        case 'ending':
          ending = event.id;
          break;
        case 'scene-end': {
          // jump を持たないシーンは章の次のシーンへ（構造テストで検出したいので記録）
          throw new Error(`ジャンプのないシーンの終端: ${event.sceneId}`);
        }
        default:
          break;
      }
    }

    expect(warn.mock.calls.filter((c) => String(c[0]).includes('scene not found'))).toEqual([]);
    expect(ending).toBe('dawn');
    expect(grades.length).toBeGreaterThanOrEqual(8);
    expect(grades.filter((g) => g === 'perfect').length).toBeGreaterThanOrEqual(8);
    warn.mockRestore();
  });

  it('わざと間違えると、エンディングが quiet になる', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = new Engine(CHAPTERS, createSave('テスト'));
    let ending: string | null = null;
    let guard = 0;
    let pending = false;
    while (ending === null && guard < 4000) {
      guard += 1;
      if (pending) {
        pending = false;
        // チュートリアル（p-tutorial）だけは正しく出す（間違えると説明がループする仕様のため）
        const drink =
          lastWrongOrder?.id === 'p-tutorial'
            ? idealDrink(lastWrongOrder)
            : makeDrink(['greenTea', 'chili'], 'hot');
        engine.resolveOrder(drink);
        continue;
      }
      const event = engine.next();
      if (event.type === 'order') {
        lastWrongOrder = event.order;
        pending = true;
      } else if (event.type === 'choice') {
        const index = event.options.findIndex((o) => !o.locked);
        engine.resolveChoice(index < 0 ? 0 : index);
      } else if (event.type === 'ending') {
        ending = event.id;
      } else if (event.type === 'scene-end') {
        throw new Error(`ジャンプのないシーンの終端: ${event.sceneId}`);
      }
    }
    expect(ending).toBe('quiet');
    warn.mockRestore();
  });
});

let lastOrder: Order | null = null;
let lastWrongOrder: Order | null = null;