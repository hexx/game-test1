import { INGREDIENT_MAP, RECIPES } from './ingredients';
import type { CharId, Mood, SaveData } from './types';

/**
 * 登場人物名鑑のデータ。
 * 基本情報（名前・種族・キャッチコピー）は最初から読めるが、
 * 「本人の声」「いつもの一杯」「もうひとつの顔」は物語の進行で解放される。
 */

export interface CharProfile {
  /** 名鑑のキャッチコピー（ネタバレなし） */
  catch: string;
  /** 初登場の章（表示用） */
  debut: string;
  /** 追加情報（種族は CharDef から取る） */
  meta: { key: string; value: string }[];
  /** 本人の声（ひとこと聴く）。順に再生する */
  lines: { mood: Mood; text: string }[];
  /** いつもの一杯 */
  usual: {
    /** 署名レシピのID（あれば名鑑でレシピ名を出す） */
    recipeId?: string;
    /** 上書きの説明（店主や主人公など、レシピを持たない人向け） */
    note?: string;
    /** セーブから動的に決まる場合の説明 */
    fromSave?: (s: SaveData) => string | null;
  };
  /** もうひとつの顔。条件を満たすと読める */
  secret: { text: string; when: (s: SaveData) => boolean };
}

const trustAtLeast = (who: CharId, value: number) => (s: SaveData) => (s.trust[who] ?? 0) >= value;

/** "coffee+milk@iced" 形式のフラグを、飲み物の名前に戻す */
function describeSavedDrink(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.includes('@')) return null;
  const [idsPart, tempPart] = raw.split('@');
  const ids = idsPart.split('+').filter((id) => id in INGREDIENT_MAP);
  if (ids.length === 0) return null;
  const recipe = RECIPES.find((r) => r.key === [...ids].sort().join('+'));
  const names = ids.map((id) => INGREDIENT_MAP[id as keyof typeof INGREDIENT_MAP].name).join('・');
  const temperature = tempPart === 'iced' ? '冷たい' : '温かい';
  return recipe ? `${recipe.name}（${temperature}）` : `${names}（${temperature}）`;
}

export const PROFILES: Record<CharId, CharProfile> = {
  garnet: {
    catch: '眠らない店の、いちばん眠らない店主。',
    debut: 'プロローグ',
    meta: [
      { key: '仕事', value: 'カフェ・ノクターナルの店主' },
      { key: '特技', value: '眠れない客の話を、一晩で覚えている' },
      { key: '困りごと', value: '自分の話だけは、うまく話せない' },
    ],
    lines: [
      { mood: 'smile', text: 'いらっしゃい。今夜も、眠れない顔をしてる。' },
      { mood: 'normal', text: 'ルールは三つ。……まあ、座ってから話しましょう。' },
      { mood: 'tired', text: '私は夢を喰う側でね。見る側じゃないの。だから、夜が終わるのが、少しだけ、いや。' },
    ],
    usual: { note: '自分では淹れない人。人の一杯を、隣で眺めている。' },
    secret: {
      when: (s) => Boolean(s.flags.garnet_dream),
      text: '夢を喰う獣は、自分の夢を持てない。だから彼女は、百年かけて、店を出る決心をした。',
    },
  },
  yuki: {
    catch: '冷たいものを飲みながら、あたたかい話を書く。',
    debut: 'プロローグ',
    meta: [
      { key: '書きもの', value: '夜の街の短編' },
      { key: '苦手', value: '自分の作品を、人に読ませること' },
      { key: '好き', value: '苦いもの（飲んでいるあいだ、黙っていられるから）' },
    ],
    lines: [
      { mood: 'shy', text: '……こんばんは。まだ、開いてますか。' },
      { mood: 'normal', text: '雪女って、寒いところの話ばかり書くと思われるんですけど。わたしが書きたいのは、もっと、べつのことなんです。' },
      { mood: 'smile', text: '苦いものは、好きです。飲んでるあいだ、うまく言えないことを、言わなくていいので。' },
    ],
    usual: { recipeId: 'latte', note: 'アイスで。ミルクを少しだけ。' },
    secret: {
      when: (s) => Boolean(s.flags.yuki_continues) || trustAtLeast('yuki', 8)(s),
      text: '読み合わせで酷評された夜、それでも「書きます」と言った。その短編は、いつかこの店の話になる。',
    },
  },
  luca: {
    catch: '夜が騒がしいのは、耳のせいだけじゃない。',
    debut: '第一章',
    meta: [
      { key: '楽器', value: 'ベース' },
      { key: '昼の顔', value: 'ふつうの仕事（決めた）' },
      { key: '苦手', value: '静かな夜（耳が良すぎる）' },
    ],
    lines: [
      { mood: 'tired', text: 'よお。……今日は、なんか、あったかいやつ。' },
      { mood: 'normal', text: '嗅覚がいいと、街の音が全部、匂いで入ってくるんだ。雨の匂い、油の匂い、誰かの不安の匂い。夜は、ずっと賑やかで、うるさい。' },
      { mood: 'happy', text: '続けるよ。続けられる範囲で。昼は働いて、夜はベースを弾く。……ずるい生き方だけどな。' },
    ],
    usual: { recipeId: 'honey-milk', note: '疲れた夜は、これ。' },
    secret: {
      when: (s) => Boolean(s.flags.luca_decided) || Boolean(s.flags.heard_luca),
      text: 'メンバーが辞めても、音は手の中に残った。この店で弾いた一音が、止まっていた時計を動かした。',
    },
  },
  mira: {
    catch: '「好き」の定義を、いま集めている途中。',
    debut: '第一章',
    meta: [
      { key: '仕事', value: '接客の学習中' },
      { key: '特技', value: '味を数値で言い当てる（好みは言い当てられない）' },
      { key: '記録', value: '名前のつかない項目が、ひとつ増えた' },
    ],
    lines: [
      { mood: 'normal', text: 'こんばんは。……ええと、いま、扉の前に待機列はありませんでした。' },
      { mood: 'think', text: '甘い、酸っぱい、苦い、と分類はできます。でも、分類と、好きは、違うみたいなんです。' },
      { mood: 'smile', text: 'この味を、「好き」と呼ぶことにします。……学習、完了です。' },
    ],
    usual: {
      recipeId: undefined,
      note: 'まだ決まっていない。',
      fromSave: (s) => {
        const name = describeSavedDrink(s.flags.mira_favorite);
        return name ? `${name}――あなたが淹れた、最初の「好き」。` : null;
      },
    },
    secret: {
      when: (s) => Boolean(s.flags.mira_likes),
      text: '数値にならない味を「好き」と名づけた最初の夜。彼女の学習ログに、名前のない項目がひとつ増えた。',
    },
  },
  sera: {
    catch: '感情は契約書に書けない。だから、飲み物に頼る。',
    debut: '第二章',
    meta: [
      { key: '仕事', value: '司法書士' },
      { key: '特技', value: 'どんな話も条文の形に直せる（自分の話だけは除く）' },
      { key: '故郷', value: '雪の降る、山あいの村' },
    ],
    lines: [
      { mood: 'smug', text: 'この雨は、傘を持っていない者にだけ、意地悪ですね。' },
      { mood: 'normal', text: '祖母は、村でいちばん遅くまで起きている人でした。私は、眠らない子でしたから、よく、その背中を見ていました。' },
      { mood: 'tired', text: '私の署名が、一行あれば終わる案件です。……それが、まだ、できていません。' },
    ],
    usual: { recipeId: 'home-tea', note: '保存状態の悪い紅茶に、酸っぱいものと、蜜をひとさじ。' },
    secret: {
      when: (s) => Boolean(s.flags.sera_home),
      text: '村の家には、もう誰もいない。それでも彼女は、署名をする前に、あの味をもう一度飲みに来る。',
    },
  },
  noa: {
    catch: '手紙は濡らさない。自分は濡れる。',
    debut: '第二章',
    meta: [
      { key: '仕事', value: '配達（街じゅう、どこへでも）' },
      { key: '特技', value: '三日かけて、山の上まで走れる' },
      { key: '好き', value: 'とにかく甘いもの' },
    ],
    lines: [
      { mood: 'happy', text: 'ぬれてるの! 配達なの! とどけたの! えらいから、あまいのみたい!' },
      { mood: 'normal', text: '手紙は、びしょぬれになったら困るでしょ。だから、走る。走ると、体があったかくなる。' },
      { mood: 'smile', text: 'あまいのが飲めると、世界、できてる! って思うの。' },
    ],
    usual: { recipeId: 'honey-cocoa', note: 'あったかくて、すごくあまいやつ。' },
    secret: {
      when: trustAtLeast('noa', 4),
      text: '山の上の手紙は、三日かけて届く。……その三日の道のりを、彼女はいつも、ひとりで走っている。',
    },
  },
  olga: {
    catch: '分厚い手で、髪の毛より細い歯車を扱う。',
    debut: '第三章',
    meta: [
      { key: '仕事', value: '時計職人' },
      { key: '特技', value: '百年、時計を見てきた目（腰は、それほど強くない）' },
      { key: '好み', value: '苦いもの。正直の味だから' },
    ],
    lines: [
      { mood: 'think', text: '中の歯車は、ぜんぶ生きてる。……止まる理由が、どこにもない。' },
      { mood: 'normal', text: '苦いのは、正直の味だ。甘いのは、ごまかす。辛いのは、急かす。' },
      { mood: 'smile', text: '時計ってのはな。止まるのにも、理由がいるんだ。' },
    ],
    usual: { recipeId: 'ginger-coffee', note: '濃いめで。体の芯が起きるやつ。' },
    secret: {
      when: (s) => Boolean(s.flags.clock_secret),
      text: '壁の時計を止めたのは、店主だ。彼はそれに気づいて、直さずに帰った。——直せなかった、とも言う。',
    },
  },
  kai: {
    catch: 'この店に入った、新しいバリスタ。──あなた。',
    debut: 'プロローグ',
    meta: [
      { key: '仕事', value: 'バリスタ（この店の）' },
      { key: '特技', value: '眠れない話を、最後まで聴く' },
      { key: '道具', value: 'レシピ帳と、カップと、湯気' },
    ],
    lines: [
      { mood: 'normal', text: '（……ここで合っているはずだ。）' },
      { mood: 'normal', text: '（眠れない人が、眠らなくていい店。それが、この店だ。）' },
      { mood: 'normal', text: '（一杯ずつ、覚えていく。誰の夜も、同じ味にはしない。）' },
    ],
    usual: { note: '淹れる側。だから、いつもは、人の一杯を眺めている。' },
    secret: {
      when: (s) => typeof s.flags.ending === 'string',
      text: '最初の夜から、ずっとカウンターの内側に立っている人。──その名前は、あなたが決めた。',
    },
  },
};

/** 名鑑の並び順 */
export const PROFILE_ORDER: CharId[] = ['garnet', 'yuki', 'luca', 'mira', 'sera', 'noa', 'olga', 'kai'];

export function isMet(save: SaveData | null, who: CharId): boolean {
  if (!save) return false;
  if ((save.met ?? []).includes(who)) return true;
  // 旧セーブ（met を持たない）は信頼度から推定する
  return (save.trust[who] ?? 0) > 0;
}

export function usualText(profile: CharProfile, save: SaveData | null, met: boolean): string {
  if (!met) return '？？？（会うと分かります）';
  const dynamic = save ? profile.usual.fromSave?.(save) : null;
  if (dynamic) return dynamic;
  const recipe = profile.usual.recipeId
    ? RECIPES.find((r) => r.id === profile.usual.recipeId)
    : undefined;
  const base = recipe ? recipe.name : (profile.usual.note ?? '決まっていない');
  if (recipe && profile.usual.note) return `${base}（${profile.usual.note}）`;
  return base;
}

export function secretText(profile: CharProfile, save: SaveData | null): string | null {
  return save && profile.secret.when(save) ? profile.secret.text : null;
}