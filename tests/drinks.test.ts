import { describe, expect, it } from 'vitest';
import { computeTaste, gradeOrder, makeDrink, validateSelection } from '../src/game/ingredients';
import type { Order } from '../src/game/types';

describe('ドリンク生成', () => {
  it('署名レシピの名前がつく', () => {
    expect(makeDrink(['coffee', 'milk'], 'hot').name).toBe('カフェラテ');
    expect(makeDrink(['milk', 'coffee'], 'iced').name).toBe('カフェラテ');
    expect(makeDrink(['tea', 'lemon', 'honey'], 'hot').name).toBe('山の紅茶');
    expect(makeDrink(['chocolate', 'milk', 'honey'], 'hot').name).toBe('ハニーココア');
  });

  it('署名のない組み合わせは材料名で表される', () => {
    expect(makeDrink(['greenTea', 'honey'], 'hot').name).toBe('緑茶・はちみつ');
  });

  it('温度固定のレシピは温度を上書きする', () => {
    const drink = makeDrink(['chocolate', 'chili'], 'iced');
    expect(drink.temperature).toBe('hot');
    expect(drink.name).toBe('メキシカンホットチョコ');
  });

  it('味はベースと材料の加算で決まる', () => {
    const black = computeTaste(['coffee']);
    const latte = computeTaste(['coffee', 'milk']);
    expect(black.bitter).toBeGreaterThan(latte.bitter);
    expect(latte.creamy).toBeGreaterThan(black.creamy);
  });
});

describe('注文の判定', () => {
  it('exact: 一致すれば完璧', () => {
    const order: Order = {
      kind: 'exact',
      id: 't1',
      label: 'テスト',
      ingredients: ['milk', 'honey'],
      temperature: 'hot',
    };
    expect(gradeOrder(order, makeDrink(['milk', 'honey'], 'hot')).grade).toBe('perfect');
    // 温度違いは減点
    expect(gradeOrder(order, makeDrink(['milk', 'honey'], 'iced')).grade).toBe('good');
    // 別物
    expect(gradeOrder(order, makeDrink(['coffee', 'chili'], 'hot')).grade).toBe('off');
  });

  it('profile: 味の近さで判定し、温度違いは減点される', () => {
    const order: Order = {
      kind: 'profile',
      id: 't2',
      label: '冷たくて苦いもの',
      want: { bitter: 6.7, aroma: 3.3 },
      temperature: 'iced',
    };
    expect(gradeOrder(order, makeDrink(['coffee'], 'iced')).grade).toBe('perfect');
    expect(gradeOrder(order, makeDrink(['tea'], 'iced')).grade).not.toBe('perfect');
    const hot = gradeOrder(order, makeDrink(['coffee'], 'hot'));
    expect(hot.score).toBeLessThan(gradeOrder(order, makeDrink(['coffee'], 'iced')).score);
  });

  it('free: 何を出しても成立する', () => {
    const order: Order = { kind: 'free', id: 't3', label: 'おまかせ' };
    expect(gradeOrder(order, makeDrink(['greenTea', 'mint'], 'iced')).grade).toBe('good');
  });
});

describe('材料の検証', () => {
  it('ベースが必要', () => {
    expect(validateSelection(['honey', 'lemon']).ok).toBe(false);
    expect(validateSelection(['tea', 'honey']).ok).toBe(true);
  });
  it('3つまで', () => {
    expect(validateSelection(['coffee', 'milk', 'honey', 'nuts']).ok).toBe(false);
  });
  it('空は不可', () => {
    expect(validateSelection([]).ok).toBe(false);
  });
});