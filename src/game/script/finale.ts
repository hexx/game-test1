import { INGREDIENT_MAP, profileOrder } from '../ingredients';
import type { Chapter, IngredientId, Order, SaveData, Temperature } from '../types';
import {
  branch,
  choice,
  ending,
  enter,
  exit,
  heart,
  jump,
  nar,
  order,
  say,
  sfx,
  shake,
} from './helpers';

const VALID_IDS = new Set(Object.keys(INGREDIENT_MAP));

/** 'coffee+milk@iced' 形式のフラグを注文に戻す */
function parseSavedOrder(str: unknown, fallback: IngredientId[]): { ids: IngredientId[]; temp: Temperature } {
  if (typeof str === 'string' && str.includes('@')) {
    const [idsPart, tempPart] = str.split('@');
    const ids = idsPart.split('+').filter((x) => VALID_IDS.has(x)) as IngredientId[];
    const temp: Temperature = tempPart === 'iced' ? 'iced' : 'hot';
    if (ids.length > 0) return { ids, temp };
  }
  return { ids: fallback, temp: 'hot' };
}

const miraFavoriteOrder = (s: SaveData): Order => {
  const parsed = parseSavedOrder(s.flags.mira_favorite, ['milk', 'honey']);
  return {
    kind: 'exact',
    id: 'f-mira',
    label: '「私の好き」——覚えていますか',
    ingredients: parsed.ids,
    temperature: parsed.temp,
  };
};

const missCount = (s: SaveData): number => s.drinks.filter((d) => d.grade === 'off').length;
const perfectCount = (s: SaveData): number => s.drinks.filter((d) => d.grade === 'perfect').length;

/**
 * 終章：夜明け前
 *   ライブの夜、ラッシュの注文、最後の返事、エンディング
 */
export const FINALE: Chapter = {
  id: 'finale',
  title: '終章',
  subtitle: '夜明け前',
  start: 'f0',
  scenes: [
    {
      id: 'f0',
      title: 'ライブの夜',
      bg: 'cafe-night',
      lines: [
        nar('今夜の店は、いつもと違う。'),
        nar('椅子が、壁に沿って並べられている。'),
        nar('棚の瓶のあいだに、小さなスピーカーが二つ。'),
        nar('カウンターの上に、弦が張られた丸い背中——ベースが、待っている。'),
        enter('luca', 'center', 'happy'),
        say('luca', '来たか。', 'happy'),
        say('luca', '今日は、俺の店じゃない。客だ。'),
        say('luca', 'でも、店主が「店側は働け」って言うから、働く。'),
        say('luca', '……ああ、もう来てる。'),
        nar('見れば、店の中は、もう、いっぱいだった。'),
        nar('ユキは窓際。ミラはカウンターの端。'),
        nar('セラは出口に近い席——逃げ道を確保する人らしい。'),
        nar('ノアは、最前列の真ん中に、陣取っている。'),
        nar('オルガは、脚立の上から、壁の時計を眺めていた。'),
        enter('noa', 'right', 'happy'),
        say('noa', 'はやくー! はやくしてー!', 'happy'),
        say('noa', 'のむもの、まだ出てない!', 'angry'),
        say('olga', 'せかすな。今日は、注文が多いんだ。', 'smile'),
        enter('garnet', 'left', 'smile'),
        say('garnet', 'はい、静かに。', 'smile'),
        say('garnet', '……今日は、この店の、いちばん長い夜になる。'),
        say('garnet', '最後だからって、別に、寂しい話じゃないのよ。'),
        say('garnet', '長い夜は、長いぶん、話ができるの。', 'smile'),
        say('garnet', 'それじゃ、バリスタ。', 'normal'),
        say('garnet', 'いつもの人たちに、いつものものを。'),
        say('garnet', '……ひとつ間違えたら、ライブは、中止になるからね。', 'smug'),
        heart('（笑って言っている。笑って言っているが、言っている。）'),
        say('luca', 'おい、店主。それ、俺のライブが人質じゃねえか。', 'surprise'),
        say('garnet', 'ふふ。', 'smile'),
        exit('luca'),
        exit('noa'),
        exit('garnet'),
        jump('f1'),
      ],
    },
    {
      id: 'f1',
      title: 'ラッシュ・1',
      bg: 'cafe-counter',
      lines: [
        enter('yuki', 'center', 'normal'),
        say('yuki', '……あの。'),
        say('yuki', 'いつもの、お願いします。', 'shy'),
        say('yuki', '冷たいの。ミルク入りの。'),
        say('yuki', '……忘れられてたら、かなしいので、先に言っておきます。'),
        order({
          order: {
            kind: 'exact',
            id: 'f-yuki',
            label: 'いつもの（冷たい、ミルク入り）',
            ingredients: ['coffee', 'milk'],
            temperature: 'iced',
          },
          customer: 'yuki',
          hint: 'ユキ：コーヒー＋ミルク／アイス。',
          results: { perfect: 'f2', good: 'f2', off: 'f2' },
        }),
      ],
    },
    {
      id: 'f2',
      title: 'ラッシュ・2',
      bg: 'cafe-counter',
      lines: [
        exit('yuki'),
        enter('mira', 'center', 'smile'),
        say('mira', 'こんばんは。'),
        say('mira', '……前に、おまかせでお願いしたもの、覚えていますか。'),
        say('mira', '私は、覚えています。', 'normal'),
        say('mira', 'いちばん最初に、「好き」になった味です。'),
        say('mira', 'もういちど、それで。', 'smile'),
        order({
          order: miraFavoriteOrder,
          customer: 'mira',
          hint: 'ミラ：第三章であなたが淹れた一杯が、彼女の「好き」。',
          results: { perfect: 'f3', good: 'f3', off: 'f3' },
        }),
      ],
    },
    {
      id: 'f3',
      title: 'ラッシュ・3',
      bg: 'cafe-counter',
      lines: [
        exit('mira'),
        enter('sera', 'right', 'normal'),
        say('sera', '……おや。私の番ですか。', 'normal'),
        say('sera', 'では、契約どおりに。'),
        say('sera', '山の紅茶。', 'smug'),
        say('sera', '茶葉と、酸っぱいものと、蜜。温かいもの。'),
        say('sera', '……先に言いましたからね。口約束ですが。', 'smile'),
        order({
          order: {
            kind: 'exact',
            id: 'f-sera',
            label: '山の紅茶',
            ingredients: ['tea', 'lemon', 'honey'],
            temperature: 'hot',
          },
          customer: 'sera',
          hint: 'セラ：紅茶＋レモン＋はちみつ／温かい。',
          results: { perfect: 'f4', good: 'f4', off: 'f4' },
        }),
      ],
    },
    {
      id: 'f4',
      title: 'ラッシュ・4',
      bg: 'cafe-counter',
      lines: [
        exit('sera'),
        enter('noa', 'center', 'happy'),
        say('noa', 'まってた! まってたえらい!', 'happy'),
        say('noa', 'あまいの! すごくあまいの!'),
        say('noa', 'あったかくて、もー、あまいの!', 'happy'),
        order({
          order: profileOrder({
            id: 'f-noa',
            label: 'すごく甘くて、あったかいもの',
            from: ['chocolate', 'milk', 'honey'],
            temperature: 'hot',
          }),
          customer: 'noa',
          hint: 'ノア：すごく甘いやつ。',
          results: { perfect: 'f5', good: 'f5', off: 'f5' },
        }),
      ],
    },
    {
      id: 'f5',
      title: 'ラッシュ・5',
      bg: 'cafe-counter',
      lines: [
        exit('noa'),
        nar('最後に、カウンターの端から、ぺこりと頭が下がった。'),
        enter('olga', 'right', 'normal'),
        say('olga', '俺は、遠慮しとこうと思ったんだがな。'),
        say('olga', 'ノアが「全員ぶん」って言うから。', 'smile'),
        say('olga', '苦いやつ。頼む。'),
        say('olga', 'この店の最後の夜に、俺が飲むと決めてる。'),
        order({
          order: profileOrder({
            id: 'f-olga',
            label: '苦くて、強いもの',
            from: ['coffee', 'ginger'],
            temperature: 'hot',
          }),
          customer: 'olga',
          hint: 'オルガ：苦くて強いもの。',
          results: { perfect: 'f6', good: 'f6', off: 'f6' },
        }),
      ],
    },
    {
      id: 'f6',
      title: '最後の一杯',
      bg: 'cafe-night',
      lines: [
        exit('olga'),
        nar('カップが、五つ。'),
        nar('カウンターの上に、夜の数だけ、湯気が立っている。'),
        nar('誰も、まだ、飲まない。'),
        nar('ルカが、ベースを抱えて、立ち上がった。'),
        enter('luca', 'center', 'happy'),
        say('luca', 'じゃあ、最初の一曲。'),
        say('luca', 'この店で弾くのは、はじめてだ。'),
        say('luca', '……みんな、眠れないんだろ。', 'smile'),
        say('luca', 'よかった。俺もだ。'),
        nar('最初の音が、ランプの光を、揺らした。'),
        nar('低い音。床から、足の裏に伝わってくる音。'),
        sfx('clink'),
        nar('ユキが、目を閉じた。'),
        nar('ミラは、音を、記録するように、じっと聴いていた。'),
        nar('セラは、外套を脱いだ。'),
        nar('ノアは、膝の上で、リズムを取っている。'),
        nar('オルガは、壁の時計を見て、それから、目を細めた。'),
        nar('——時計の長い針が、動いた。'),
        shake(),
        sfx('whoosh'),
        say('olga', '……おい。', 'surprise'),
        say('olga', '時計が、進んだぞ。', 'surprise'),
        nar('壁の時計は、零時一分を指していた。'),
        nar('百年、止まっていた針だった。'),
        enter('garnet', 'right', 'surprise'),
        say('garnet', '……あ。', 'surprise'),
        say('garnet', 'うそ。', 'surprise'),
        say('garnet', '私、まだ、迷ってたのに。', 'shy'),
        nar('店主は、カップの湯気の向こうで、少しだけ、泣きそうな顔をしていた。'),
        nar('それから、まっすぐに、こちらを見た。'),
        say('garnet', 'バリスタ。', 'normal'),
        say('garnet', '最後の注文の、返事をください。', 'smile'),
        say('garnet', 'この店を、どうする?'),
        jump('f7'),
      ],
    },
    {
      id: 'f7',
      title: '返事',
      bg: 'cafe-night',
      lines: [
        choice(
          [
            {
              text: '「この店を、続けます」',
              set: (s) => {
                s.flags.answer = 'continue';
              },
              to: 'f_stay',
            },
            {
              text: '「ガーネットさんの夢を、探す旅に出たい」',
              set: (s) => {
                s.flags.answer = 'go';
              },
              to: 'f_go',
            },
            {
              text: '「みんなに、聞いてみたい」',
              when: (s) =>
                Object.values(s.trust).reduce((a, b) => a + b, 0) >= 12,
              lockedNote: '（もっと、みんなの話を聴かないと）',
              set: (s) => {
                s.flags.answer = 'ask';
              },
              to: 'f_ask',
            },
          ],
          '返事をする',
        ),
      ],
    },

    /* ---------------- これから ---------------- */
    {
      id: 'f_stay',
      bg: 'cafe-night',
      lines: [
        say('garnet', '……そう。', 'smile'),
        say('garnet', 'うん。いい返事。', 'smile'),
        branch(
          (s) => missCount(s) <= 2,
          [
            say('garnet', 'あなた、ちゃんと、みんなの味を覚えてる。', 'normal'),
            say('garnet', 'この店は、もう、あなたの店ね。'),
            jump('e_dawn_1'),
          ],
          [
            say('garnet', '……ただ、少し、気になることが。', 'tired'),
            say('garnet', '最近、お客さんの注文と、ちがうものが、出てたでしょう。'),
            say('garnet', '味は、好みだから、まちがいは、悪いことじゃないの。'),
            say('garnet', 'でも、聴くことを、忘れてはいけない。', 'normal'),
            say('garnet', '……少し、休みましょうか。'),
            jump('e_quiet_1'),
          ],
        ),
      ],
    },
    {
      id: 'f_go',
      bg: 'cafe-night',
      lines: [
        say('garnet', '……え。', 'surprise'),
        say('garnet', '私と?', 'surprise'),
        say('garnet', 'だめよ。あなた、ここで、やっと見つかったんでしょう。'),
        say('garnet', '淹れる人が、淹れる場所を見つけるまで、どれだけかかったと思ってるの。', 'normal'),
        heart('（ガーネットは、こういうときに、いちばん長く話す人だ。）'),
        say('garnet', '……ふう。', 'tired'),
        say('garnet', 'わかった。じゃあ、そうしましょう。'),
        say('garnet', '夢を探すのは、一人より、二人のほうが、眠くなりにくいし。', 'smile'),
        jump('e_dream_1'),
      ],
    },
    {
      id: 'f_ask',
      bg: 'cafe-night',
      lines: [
        nar('カウンターの向こうから、みんなのほうへ、声をかけた。'),
        heart('（この店を、どうするべきか。）'),
        say('yuki', '……わたしは。', 'shy'),
        say('yuki', 'この店の話を、書きます。'),
        say('yuki', '眠れない人が、眠らなくていい店の話。'),
        say('yuki', 'だから、なくなったら、こまる。', 'normal'),
        say('luca', '俺は、ここで弾くって決めた。', 'happy'),
        say('luca', 'セットリスト、もう、二十曲ある。'),
        say('luca', '店が閉まったら、ベースが置けなくなる。'),
        say('mira', '私は、ここの飲み物を、全部記録しました。', 'normal'),
        say('mira', 'ですが、記録は、続きがあるから、記録なんです。', 'smile'),
        say('mira', 'なので、続けてください。'),
        say('sera', '……契約書を作りましょうか。', 'smug'),
        say('sera', '「この店を、勝手に閉めないこと」。'),
        say('sera', '違反したら、違約金は——そうですね、コーヒー一杯で。', 'smile'), 
        say('noa', 'わたしは、あまいのがのみたい!', 'happy'),
        say('noa', 'いま! すぐ!'),
        say('olga', '……時計は、もう進みだした。', 'normal'),
        say('olga', '止めたやつが、止めるのをやめたんだ。'),
        say('olga', 'なら、あとは、進むだけだ。'),
        nar('ノアが、いちばん大きな声で言った。'),
        say('noa', '——だから! ここ、つづけるの!', 'happy'),
        say('garnet', '……', 'surprise'),
        say('garnet', 'みんな、私より、決めるのが早い。', 'smile'),
        say('garnet', 'ずるい。', 'shy'),
        say('garnet', '……ねえ、バリスタ。', 'normal'),
        say('garnet', 'この店、あなたにあげる。'),
        say('garnet', '私は、夢を探しに行く。'),
        say('garnet', '見つけたら、帰ってくる。客として。', 'smile'),
        say('garnet', 'だから、店を、開けておいて。', 'smile'),
        jump('e_dawn_1'),
      ],
    },

    /* ---------------- エンディング ---------------- */
    {
      id: 'e_dawn_1',
      bg: 'cafe-dawn',
      lines: [
        nar('ライブは、夜明けまで続いた。'),
        nar('オルガが途中で寝て、ノアが起きていて、'),
        nar('セラが、寝ているオルガに、自分の外套をかけた。'),
        nar('ミラは、曲のテンポを全部、記録していた。'),
        nar('ユキは、原稿の最後のページを、その場で書き直していた。'),
        nar('それが、この店の、最初の一日になった。'),
        nar('——それから、しばらく。'),
        nar('カフェ・ノクターナルは、零時から、夜明けまで、開いている。'),
        nar('看板は、そのまま。'),
        nar('カウンターの向こうには、あなたが立っている。'),
        nar('壁の時計は、ちゃんと、動いている。'),
        nar('雨の日は、ユキが来る。'),
        nar('ライブの夜は、ルカが来る。'),
        nar('ミラは、味の記録を、まだ続けている。'),
        nar('セラは、書類の話をしない日だけ、来る。'),
        nar('ノアは、毎回来る。'),
        nar('そして、扉のベルが鳴るたび、あなたは、一杯を作る。'),
        nar('眠れない誰かのために。'),
        nar('眠らなくてもいい夜のために。'),
        nar('——それが、この店の、ずっと長い夜のはじまりだった。'),
        ending('dawn'),
      ],
    },
    {
      id: 'e_dream_1',
      bg: 'cafe-dawn',
      lines: [
        nar('店を閉めて、看板を下ろした。'),
        nar('壁の時計は、旅の支度のあいだも、鳴り続けている。'),
        nar('ガーネットは、棚の瓶を、ひとつだけ、鞄に入れた。'),
        nar('ミラが、鍵を預かると言った。'),
        nar('「いつか戻る日のために、店の味を、記録しておきます」'),
        nar('ユキは、置き手紙の代わりに、短編を置いていった。'),
        nar('タイトルは、「喫茶店の夜」。'),
        nar('ルカは、ベースを置いていった。'),
        nar('「帰ってきたら、弾くから」'),
        nar('ノアは、泣いて、それから、笑った。'),
        nar('セラは、鍵の契約書を、きちんと作った。'),
        nar('——それから、ふたりで、夜の街を出た。'),
        nar('行き先は、決めていない。'),
        nar('夢というのは、たぶん、そういう場所にあるのだと思う。'),
        nar('途中で、ガーネットが、空を見上げて、言った。'),
        nar('「ねえ。眠くなってきた」'),
        nar('「こんなの、はじめて」'),
        nar('——朝が来た。'),
        nar('はじめて、二人そろって、眠った。'),
        ending('dream'),
      ],
    },
    {
      id: 'e_quiet_1',
      bg: 'cafe-dawn',
      lines: [
        nar('店は、しばらく、休みになった。'),
        nar('ガーネットは、看板の灯りを、そっと消した。'),
        nar('「あなたの淹れる一杯は、おいしいのよ」'),
        nar('「でも、聴くことより、作ることが、先になっていた」'),
        nar('「それは、この店では、いちばん、いけないこと」'),
        nar('その夜から、客足は、少しずつ、遠のいた。'),
        nar('ユキは、原稿を、別の店で書くようになった。'),
        nar('ルカのライブは、どこか別の場所で、開かれた。'),
        nar('ミラは、記録を続けた。けれど、記録する味が、増えなかった。'),
        nar('オルガは、時計を、直さなかった。'),
        nar('時計は、また、零時で止まった。'),
        nar('——それでも。'),
        nar('扉のベルは、壊れていない。'),
        nar('看板も、棚の瓶も、そのままになっている。'),
        nar('いつか、また、灯りを点ける日のために。'),
        nar('そのときは、最初の一杯を、ちゃんと、聴いてから作ろう。'),
        ending('quiet'),
      ],
    },
  ],
};

export const finaleStats = { missCount, perfectCount };