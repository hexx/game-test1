// ゲーム全体で使う型定義。

/** 味覚の軸。レーダーチャートの6軸と一致させる。 */
export const TASTE_AXES = ['bitter', 'sweet', 'sour', 'spicy', 'aroma', 'creamy'] as const;
export type TasteAxis = (typeof TASTE_AXES)[number];

export const TASTE_LABEL: Record<TasteAxis, string> = {
  bitter: '苦味',
  sweet: '甘味',
  sour: '酸味',
  spicy: '香辛',
  aroma: '香り',
  creamy: 'まろやか',
};

export type Temperature = 'hot' | 'iced';

export type IngredientId =
  | 'coffee'
  | 'tea'
  | 'greenTea'
  | 'chocolate'
  | 'milk'
  | 'honey'
  | 'cinnamon'
  | 'ginger'
  | 'mint'
  | 'lemon'
  | 'nuts'
  | 'caramel'
  | 'vanilla'
  | 'chili';

export interface Ingredient {
  id: IngredientId;
  name: string;
  /** カップに注いだときの色（混色に使う） */
  color: string;
  /** 単体でドリンクのベースになれるか */
  base: boolean;
  /** 味覚への寄与（加算） */
  taste: Partial<Record<TasteAxis, number>>;
  icon: string;
  note: string;
}

export interface Drink {
  ingredients: IngredientId[];
  temperature: Temperature;
  /** 混色結果 */
  color: string;
  /** 6軸のスコア（0..10） */
  taste: Record<TasteAxis, number>;
  /** 署名レシピに一致すればその名前、しなければ自動生成名 */
  name: string;
  /** 署名レシピのID（あれば） */
  recipeId?: string;
  /** 味の描写文 */
  flavor: string;
}

export interface SignatureRecipe {
  id: string;
  key: string;
  name: string;
  desc: string;
  /** 温かい/冷たいを固定するレシピ（例: メキシカンホットチョコ） */
  temperature?: Temperature;
}

/** 客の注文。exact = 材料指定、profile = 味の指定、free = おまかせ */
export type Order =
  | {
      kind: 'exact';
      id: string;
      label: string;
      ingredients: IngredientId[];
      temperature: Temperature;
    }
  | {
      kind: 'profile';
      id: string;
      label: string;
      /** 各軸 0..10 の目標値 */
      want: Partial<Record<TasteAxis, number>>;
      temperature?: Temperature;
      /** perfect / good とみなす距離（0..10 スケール、既定 1.2 / 2.6） */
      tolerance?: { perfect: number; good: number };
    }
  | { kind: 'free'; id: string; label: string };

export type Grade = 'perfect' | 'good' | 'off';

export interface GradeResult {
  grade: Grade;
  /** 0(遠い)..1(完璧) のスコア */
  score: number;
  comment: string;
}

export type Mood =
  | 'normal'
  | 'happy'
  | 'smile'
  | 'sad'
  | 'angry'
  | 'surprise'
  | 'shy'
  | 'tired'
  | 'smug'
  | 'think';

export type Slot = 'left' | 'center' | 'right' | 'far-left' | 'far-right';

export type BgId =
  | 'street-rain'
  | 'cafe-night'
  | 'cafe-counter'
  | 'cafe-window'
  | 'cafe-dawn'
  | 'kitchen'
  | 'memory'
  | 'black'
  | 'title';

/* ------------------------------------------------------------------ *
 * シナリオ記述
 * ------------------------------------------------------------------ */

export interface ChoiceOption {
  text: string;
  /** 選んだときのフラグ設定 */
  set?: (s: SaveData) => void;
  /** 選択後にジャンプするシーン（未指定なら続きから） */
  to?: string;
  /** 表示条件 */
  when?: (s: SaveData) => boolean;
  /** 選べない理由（when が false のときに表示） */
  lockedNote?: string;
}

export type Line =
  | { t: 'bg'; id: BgId; fade?: number }
  | { t: 'say'; who: CharId | 'narrator' | 'self'; text: string; mood?: Mood }
  | { t: 'enter'; who: CharId; slot?: Slot; mood?: Mood }
  | { t: 'exit'; who: CharId }
  | { t: 'mood'; who: CharId; mood: Mood }
  | { t: 'chapter'; title: string; subtitle?: string }
  | { t: 'choice'; prompt?: string; options: ChoiceOption[] }
  | {
      t: 'order';
      /** 静的な注文、またはセーブ状態から組み立てる注文 */
      order: Order | ((s: SaveData) => Order);
      customer: CharId;
      /** 判定結果ごとのジャンプ先 */
      results: { perfect?: string; good?: string; off?: string };
      /** 味のヒント（レシピ帳に書き込まれる） */
      hint?: string;
    }
  | { t: 'if'; when: (s: SaveData) => boolean; then: Line[]; else?: Line[] }
  | { t: 'set'; fn: (s: SaveData) => void }
  | { t: 'jump'; to: string }
  | { t: 'ending'; id: EndingId }
  | { t: 'wait'; ms: number }
  | { t: 'sfx'; id: SfxId }
  | { t: 'shake' };

export type SfxId = 'bell' | 'cup' | 'pour' | 'page' | 'clink' | 'whoosh' | 'heart';

export type EndingId = 'dawn' | 'dream' | 'quiet';

export interface Scene {
  id: string;
  title?: string;
  bg?: BgId;
  lines: Line[];
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  /** 章の入口シーン */
  start: string;
  scenes: Scene[];
}

/* ------------------------------------------------------------------ *
 * セーブデータ
 * ------------------------------------------------------------------ */

export interface OrderRecord {
  orderId: string;
  drinkName: string;
  grade: Grade;
  night: string;
}

export interface SaveData {
  version: number;
  /** 章ID */
  chapter: string;
  /** シーンID */
  scene: string;
  /** 実行位置のスタック（再開用） */
  frames: { path: (number | string)[]; idx: number }[];
  /** 主人公の名前 */
  name: string;
  /** 訪問済みの夜 */
  nightsDone: string[];
  /** フラグ */
  flags: Record<string, boolean | number | string>;
  /** 名鑑に載った（舞台上で出会った）人物 */
  met: CharId[];
  /** 常連との信頼度 */
  trust: Record<string, number>;
  /** 作った飲み物の履歴 */
  drinks: OrderRecord[];
  /** 発見済みレシピ */
  discovered: string[];
  /** 未発見レシピのヒント（店主のメモ） */
  hints: string[];
  /** 選択の履歴（エピローグの振り返り用） */
  choices: string[];
  playtimeMs: number;
  savedAt: number;
}

/** 立ち絵のキャラクター定義（SVGをパラメトリックに生成する） */
export interface CharDef {
  id: CharId;
  name: string;
  reading: string;
  species: string;
  /** 髪・肌・差し色 */
  hair: string;
  hairDark: string;
  skin: string;
  accent: string;
  cloth: string;
  /** 髪型 */
  hairstyle: 'bob' | 'long' | 'twin' | 'short' | 'messy' | 'bun' | 'wave' | 'hime';
  /** 目つき */
  eyestyle: 'round' | 'sharp' | 'sleepy' | 'closed';
  /** 特徴的なパーツ */
  parts: ('fangs' | 'wolflake' | 'wolfears' | 'longears' | 'wings' | 'horns' | 'visor' | 'antenna' | 'glasses' | 'beard' | 'halo' | 'snow' | 'scarf' | 'earring' | 'cheeks')[];
  intro: string;
}

export type CharId =
  | 'garnet'
  | 'yuki'
  | 'luca'
  | 'mira'
  | 'sera'
  | 'noa'
  | 'olga'
  | 'kai';