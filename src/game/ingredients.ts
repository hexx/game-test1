import {
  TASTE_AXES,
  type Drink,
  type Grade,
  type GradeResult,
  type Ingredient,
  type IngredientId,
  type Order,
  type SignatureRecipe,
  type TasteAxis,
  type Temperature,
} from './types';

/* ------------------------------------------------------------------ *
 * 材料
 * ------------------------------------------------------------------ */

export const INGREDIENTS: Ingredient[] = [
  {
    id: 'coffee',
    name: 'コーヒー',
    color: '#4a2c19',
    base: true,
    taste: { bitter: 8, aroma: 6 },
    icon: 'bean',
    note: '深煎り。苦味と香ばしさの backbone。',
  },
  {
    id: 'tea',
    name: '紅茶',
    color: '#a5561d',
    base: true,
    taste: { bitter: 4, aroma: 6, sour: 1 },
    icon: 'leaf',
    note: '香りの高いセイロン。渋みはやさしめ。',
  },
  {
    id: 'greenTea',
    name: '緑茶',
    color: '#7d8b3f',
    base: true,
    taste: { bitter: 5, aroma: 5, sour: 1 },
    icon: 'leaf',
    note: '青々とした香り。後味はすっきり。',
  },
  {
    id: 'chocolate',
    name: 'チョコレート',
    color: '#3a1f14',
    base: true,
    taste: { bitter: 3, sweet: 5, creamy: 5, aroma: 4 },
    icon: 'cocoa',
    note: 'カカオ70%。とろりと濃い。',
  },
  {
    id: 'milk',
    name: 'ミルク',
    color: '#f4e6d2',
    base: true,
    taste: { sweet: 2, creamy: 9 },
    icon: 'drop',
    note: '蒸気で立てたスチームミルク。',
  },
  {
    id: 'honey',
    name: 'はちみつ',
    color: '#d99a2b',
    base: false,
    taste: { sweet: 5, aroma: 2 },
    icon: 'drop',
    note: '野の花の蜜。甘さに厚みを足す。',
  },
  {
    id: 'cinnamon',
    name: 'シナモン',
    color: '#8a5a2b',
    base: false,
    taste: { sweet: 1, spicy: 3, aroma: 4 },
    icon: 'stick',
    note: '一振りで夜が変わる。',
  },
  {
    id: 'ginger',
    name: 'ジンジャー',
    color: '#d8b465',
    base: false,
    taste: { bitter: 1, spicy: 4, aroma: 3 },
    icon: 'root',
    note: '体の芯を起こす辛み。',
  },
  {
    id: 'mint',
    name: 'ミント',
    color: '#5fae7a',
    base: false,
    taste: { sour: 2, spicy: 1, aroma: 4 },
    icon: 'leaf',
    note: '冷たい風のような清涼感。',
  },
  {
    id: 'lemon',
    name: 'レモン',
    color: '#e5c33c',
    base: false,
    taste: { sour: 6, aroma: 3 },
    icon: 'citrus',
    note: '酸味の輪郭。',
  },
  {
    id: 'nuts',
    name: 'ナッツ',
    color: '#a8763f',
    base: false,
    taste: { sweet: 1, creamy: 3, aroma: 4 },
    icon: 'nut',
    note: '砕いたヘーゼル。香ばしさの層。',
  },
  {
    id: 'caramel',
    name: 'キャラメル',
    color: '#b5722c',
    base: false,
    taste: { sweet: 5, creamy: 2, aroma: 2 },
    icon: 'drop',
    note: '焦がした砂糖の、少しほろ苦い甘さ。',
  },
  {
    id: 'vanilla',
    name: 'バニラ',
    color: '#e8d69d',
    base: false,
    taste: { sweet: 3, creamy: 2, aroma: 5 },
    icon: 'stick',
    note: '甘い香りのポッド。',
  },
  {
    id: 'chili',
    name: 'チリ',
    color: '#a6271f',
    base: false,
    taste: { spicy: 7, bitter: 1 },
    icon: 'chili',
    note: '眠気を吹き飛ばす火。',
  },
];

export const INGREDIENT_MAP: Record<IngredientId, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
) as Record<IngredientId, Ingredient>;

/* ------------------------------------------------------------------ *
 * 署名レシピ（材料の組み合わせ → 名前）
 * ------------------------------------------------------------------ */

function keyOf(ids: IngredientId[]): string {
  return [...ids].sort().join('+');
}

export const RECIPES: SignatureRecipe[] = [
  { id: 'black', key: keyOf(['coffee']), name: 'ブラックコーヒー', desc: '豆の声をそのまま聴く一杯。' },
  { id: 'latte', key: keyOf(['coffee', 'milk']), name: 'カフェラテ', desc: '定番。泡の下に夜が沈む。' },
  { id: 'cinnamon-latte', key: keyOf(['coffee', 'milk', 'cinnamon']), name: 'シナモンラテ', desc: '香りの層が重なる。' },
  { id: 'caramel-latte', key: keyOf(['coffee', 'milk', 'caramel']), name: 'キャラメルラテ', desc: '甘さの中に焦げの気配。' },
  { id: 'vanilla-latte', key: keyOf(['coffee', 'milk', 'vanilla']), name: 'バニララテ', desc: '甘い香りの夜更かし。' },
  { id: 'nuts-latte', key: keyOf(['coffee', 'milk', 'nuts']), name: 'ナッツラテ', desc: '砕いた木の実の香ばしさ。' },
  { id: 'mocha', key: keyOf(['coffee', 'chocolate', 'milk']), name: 'モカ', desc: '苦味と甘さの共犯者。' },
  { id: 'bitter-mocha', key: keyOf(['coffee', 'chocolate']), name: 'ビターモカ', desc: 'ミルクを抜いた、切り立った味。' },
  { id: 'cocoa', key: keyOf(['chocolate', 'milk']), name: 'ココア', desc: '子どもの頃の温度。' },
  { id: 'honey-cocoa', key: keyOf(['chocolate', 'milk', 'honey']), name: 'ハニーココア', desc: '甘さが二重になった夜。' },
  { id: 'mexican', key: keyOf(['chocolate', 'chili']), name: 'メキシカンホットチョコ', desc: '喉の奥で火が灯る。', temperature: 'hot' },
  { id: 'milk-tea', key: keyOf(['tea', 'milk']), name: 'ミルクティー', desc: '渋みを抱きしめた白。' },
  { id: 'lemon-tea', key: keyOf(['tea', 'lemon']), name: 'レモンティー', desc: '澄んだ酸味。' },
  { id: 'home-tea', key: keyOf(['tea', 'lemon', 'honey']), name: '山の紅茶', desc: '誰かの祖母が淹れていた味。' },
  { id: 'vanilla-milk-tea', key: keyOf(['tea', 'milk', 'vanilla']), name: 'バニラミルクティー', desc: '香りまで甘い。' },
  { id: 'spice-tea', key: keyOf(['tea', 'cinnamon', 'honey']), name: 'スパイスティー', desc: '旅の途中で出会う味。' },
  { id: 'ginger-tea', key: keyOf(['tea', 'ginger', 'honey']), name: '風邪ひきの紅茶', desc: '誰かが心配して淹れる味。' },
  { id: 'honey-lemon-tea', key: keyOf(['greenTea', 'honey', 'lemon']), name: 'はちみつレモン緑茶', desc: '青い香りに甘酸っぱさ。' },
  { id: 'mint-green', key: keyOf(['greenTea', 'mint']), name: 'ミント緑茶', desc: '竹林を抜ける風。' },
  { id: 'honey-milk', key: keyOf(['milk', 'honey']), name: 'ハニーミルク', desc: '眠る前の一杯。' },
  { id: 'vanilla-milk', key: keyOf(['milk', 'vanilla']), name: 'バニラミルク', desc: '甘い香りの毛布。' },
  { id: 'cinnamon-milk', key: keyOf(['milk', 'cinnamon']), name: 'シナモンミルク', desc: '香りの効いた温もり。' },
  { id: 'sleepless-milk', key: keyOf(['milk', 'nuts', 'honey']), name: '眠れない夜のミルク', desc: '眠れない夜のための、あえて眠らない一杯。' },
  { id: 'ginger-coffee', key: keyOf(['coffee', 'ginger']), name: 'ジンジャーコーヒー', desc: '背筋が伸びる苦味。' },
  { id: 'mint-mocha', key: keyOf(['coffee', 'chocolate', 'mint']), name: '深夜のミントモカ', desc: '清涼感が苦味を切る。' },
  { id: 'spicy-coffee', key: keyOf(['coffee', 'chili']), name: 'ファイヤーコーヒー', desc: '眠る気をなくす一杯。' },
  { id: 'caramel-mocha', key: keyOf(['coffee', 'caramel', 'chocolate']), name: 'ビターキャラメルモカ', desc: '焦げた甘さと苦味。' },
  { id: 'nuts-mocha', key: keyOf(['coffee', 'chocolate', 'nuts']), name: 'ナッツモカ', desc: '香ばしさ三重奏。' },
  { id: 'lemon-coffee', key: keyOf(['coffee', 'lemon']), name: 'レモンコーヒー', desc: '好みの分かれる冒険。' },
  { id: 'cafe-au-lait-tea', key: keyOf(['tea', 'milk', 'honey']), name: 'ハニーミルクティー', desc: '丸い甘さの紅茶。' },
];

export const RECIPE_BY_KEY: Record<string, SignatureRecipe> = Object.fromEntries(
  RECIPES.map((r) => [r.key, r]),
);

/* ------------------------------------------------------------------ *
 * 味の計算
 * ------------------------------------------------------------------ */

const AXIS_MAX: Record<TasteAxis, number> = {
  bitter: 12,
  sweet: 18,
  sour: 12,
  spicy: 14,
  aroma: 18,
  creamy: 16,
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeTaste(ids: IngredientId[]): Record<TasteAxis, number> {
  const raw: Record<TasteAxis, number> = { bitter: 0, sweet: 0, sour: 0, spicy: 0, aroma: 0, creamy: 0 };
  for (const id of ids) {
    const ing = INGREDIENT_MAP[id];
    for (const axis of TASTE_AXES) {
      raw[axis] += ing.taste[axis] ?? 0;
    }
  }
  // カップの容量は決まっている。材料が増えるほど、ひとつぶんの味は薄まる。
  const volume = 1 + 0.35 * Math.max(0, ids.length - 1);
  const out = {} as Record<TasteAxis, number>;
  for (const axis of TASTE_AXES) {
    out[axis] = clamp01(raw[axis] / (AXIS_MAX[axis] * volume)) * 10;
  }
  return out;
}

function mixColors(ids: IngredientId[]): string {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const id of ids) {
    const hex = INGREDIENT_MAP[id].color;
    r += parseInt(hex.slice(1, 3), 16);
    g += parseInt(hex.slice(3, 5), 16);
    b += parseInt(hex.slice(5, 7), 16);
  }
  r = Math.round(r / ids.length);
  g = Math.round(g / ids.length);
  b = Math.round(b / ids.length);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const FLAVOR_WORDS: Record<TasteAxis, { high: string; low: string }> = {
  bitter: { high: '苦く', low: '苦味は控えめで' },
  sweet: { high: '甘く', low: '甘さはひかえめで' },
  sour: { high: '酸味がきいて', low: '酸味はやわらかく' },
  spicy: { high: '香辛料が効いて', low: '刺激は控えめで' },
  aroma: { high: '香り高く', low: '香りは静かで' },
  creamy: { high: 'まろやかで', low: 'さらりとしていて' },
};

function buildFlavor(taste: Record<TasteAxis, number>, temperature: Temperature): string {
  const ranked = TASTE_AXES.map((axis) => ({ axis, v: taste[axis] })).sort((a, b) => b.v - a.v);
  const top = ranked.filter((r) => r.v >= 4).slice(0, 2);
  const temp = temperature === 'iced' ? '冷たく' : '温かく';
  if (top.length === 0) return `${temp}て、輪郭のおだやかな飲み物。`;
  const words = top.map((t) => FLAVOR_WORDS[t.axis].high).join('、');
  return `${temp}て、${words}仕上がり。`;
}

export function autoName(ids: IngredientId[]): string {
  const names = ids.map((id) => INGREDIENT_MAP[id].name);
  const base = INGREDIENT_MAP[ids[0]];
  const rest = names.slice(1);
  if (rest.length === 0) return `${base.name}（そのまま）`;
  return `${names[0]}・${rest.join('・')}`;
}

export function makeDrink(ids: IngredientId[], temperature: Temperature): Drink {
  const recipe = RECIPES.find((r) => r.key === keyOf(ids));
  const temp = recipe?.temperature ?? temperature;
  const taste = computeTaste(ids);
  return {
    ingredients: [...ids],
    temperature: temp,
    color: mixColors(ids),
    taste,
    name: recipe?.name ?? autoName(ids),
    recipeId: recipe?.id,
    flavor: buildFlavor(taste, temp),
  };
}

/** 飲み物の一意キー（材料＋温度） */
export function drinkKey(ids: IngredientId[], temperature: Temperature): string {
  return `${[...ids].sort().join('+')}|${temperature}`;
}

/** 代表的な一杯から「味の指定」注文を作る（作者側の記述を簡単にするため） */
export function profileOrder(opts: {
  id: string;
  label: string;
  from: IngredientId[];
  temperature?: Temperature;
  tolerance?: { perfect: number; good: number };
}): Order {
  const want = computeTaste(opts.from);
  return {
    kind: 'profile',
    id: opts.id,
    label: opts.label,
    want,
    temperature: opts.temperature,
    tolerance: opts.tolerance,
  };
}

/* ------------------------------------------------------------------ *
 * 注文の判定
 * ------------------------------------------------------------------ */

const DEFAULT_TOLERANCE = { perfect: 1.2, good: 2.6 };

export function gradeOrder(order: Order, drink: Drink): GradeResult {
  if (order.kind === 'exact') {
    const want = [...order.ingredients].sort().join('+');
    const got = [...drink.ingredients].sort().join('+');
    const tempOk = order.temperature === drink.temperature;
    if (want === got && tempOk) {
      return { grade: 'perfect', score: 1, comment: '完璧。' };
    }
    if (want === got) {
      return { grade: 'good', score: 0.8, comment: '材料は合っているが、温度がちがう。' };
    }
    const wantSet = new Set(order.ingredients);
    const gotSet = new Set(drink.ingredients);
    const inter = [...wantSet].filter((x) => gotSet.has(x)).length;
    const union = new Set([...wantSet, ...gotSet]).size;
    const jaccard = inter / union;
    const score = jaccard * (tempOk ? 1 : 0.8);
    if (jaccard >= 0.66) return { grade: 'good', score, comment: '近い。' };
    return { grade: 'off', score, comment: '違う。' };
  }

  if (order.kind === 'profile') {
    const axes = Object.keys(order.want) as TasteAxis[];
    let dist = 0;
    for (const axis of axes) {
      dist += Math.abs(drink.taste[axis] - (order.want[axis] ?? 0));
    }
    dist /= Math.max(1, axes.length);
    const tol = order.tolerance ?? DEFAULT_TOLERANCE;
    const tempMismatch = Boolean(order.temperature) && order.temperature !== drink.temperature;
    let grade: Grade = dist <= tol.perfect ? 'perfect' : dist <= tol.good ? 'good' : 'off';
    if (tempMismatch && grade === 'perfect') grade = 'good';
    const score = Math.max(0, 1 - dist / 6 - (tempMismatch ? 0.15 : 0));
    return { grade, score, comment: `${order.label}（距離 ${dist.toFixed(1)}）` };
  }

  return { grade: 'good', score: 0.8, comment: 'おまかせ。' };
}

export const BASE_INGREDIENTS = INGREDIENTS.filter((i) => i.base);
export const ADD_INGREDIENTS = INGREDIENTS.filter((i) => !i.base);

export function validateSelection(ids: IngredientId[]): { ok: boolean; reason?: string } {
  if (ids.length === 0) return { ok: false, reason: '材料を選んでください' };
  if (ids.length > 3) return { ok: false, reason: '材料は3つまで' };
  if (!ids.some((id) => INGREDIENT_MAP[id].base)) {
    return { ok: false, reason: 'ベースになる材料（コーヒー・紅茶・緑茶・チョコレート・ミルク）が必要です' };
  }
  return { ok: true };
}