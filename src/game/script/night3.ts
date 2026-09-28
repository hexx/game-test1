import { profileOrder } from '../ingredients';
import type { Chapter } from '../types';
import {
  chapterCard,
  choice,
  enter,
  exit,
  heart,
  jump,
  nar,
  order,
  say,
  set,
  sfx,
  trustUp,
} from './helpers';

/**
 * 第三章：苦いものを
 *   オルガ（時計職人）→ ミラの「好き」→ ユキの挫折
 */
export const NIGHT3: Chapter = {
  id: 'night3',
  title: '第三章',
  subtitle: '苦いものを',
  start: 'n3a',
  scenes: [
    {
      id: 'n3a',
      title: '止まった時計',
      bg: 'cafe-counter',
      lines: [
        nar('店の壁の時計が、今夜も零時で止まっている。'),
        nar('ガーネットは前に「そのうち直るわ」と言った。'),
        nar('その「そのうち」が、今日らしい。'),
        sfx('bell'),
        enter('olga', 'center', 'normal'),
        say('olga', 'よお。道具、置くぞ。'),
        nar('入ってきたのは、背の低い、肩の厚い男だった。'),
        nar('手が、ひどく大きい。指の関節が、木の節みたいに固い。'),
        say('olga', 'オルガ。時計をいじるのが仕事だ。', 'normal'),
        say('olga', '店主に呼ばれてな。あの、零時で止まってるやつ。'),
        nar('彼は脚立を立てて、時計の前に立った。'),
        nar('腹のあたりで、工具が、ちいさく鳴った。'),
        say('olga', '……ふむ。', 'think'),
        say('olga', '中の歯車は、ぜんぶ生きてる。'),
        say('olga', '埃もなけりゃ、錆もない。油も、ちゃんと差してある。'),
        say('olga', '止まる理由が、どこにもない。', 'normal'),
        say('olga', 'こういうのは初めてだ。百年、時計を見てきてな。'),
        heart('（百年、という言葉を、この人はさらりと言う。）'),
        say('olga', 'まあいい。考えるには、まず、濃いのが要る。', 'normal'),
        say('olga', '苦くて、強いやつ。'),
        say('olga', '眠気なんて、遠くに置いてくるようなやつを頼む。'),
        order({
          order: profileOrder({
            id: 'n3-olga-1',
            label: '苦くて、強いもの',
            from: ['coffee', 'ginger'],
            temperature: 'hot',
          }),
          customer: 'olga',
          hint: 'オルガ：苦味が強く、体が起きる辛み。コーヒー＋ジンジャー。',
          results: { perfect: 'n3b', good: 'n3b', off: 'n3b2' },
        }),
      ],
    },
    {
      id: 'n3b',
      bg: 'cafe-counter',
      lines: [
        nar('オルガは、カップを手のひらに乗せた。'),
        nar('分厚い手に、カップが、すっかり隠れてしまう。'),
        say('olga', '……ああ。これだ。', 'smile'),
        say('olga', '苦いのは、正直の味だ。'),
        say('olga', '甘いのは、ごまかす。辛いのは、急かす。'),
        say('olga', '苦いのは、そのまま、ものの話をする。', 'normal'),
        nar('彼はカップを置いて、もう一度、壁の時計を見上げた。'),
        say('olga', 'なあ、あんた。時計ってのはな。'),
        say('olga', '止まるのにも、理由がいるんだ。'),
        say('olga', 'ぜんまいが切れて止まる。埃で止まる。誰かが止める。'),
        say('olga', 'この時計は、どれでもない。'),
        say('olga', '……持ち主が、進むのを、いらないと思ってる。', 'think'),
        say('olga', '俺の腕じゃ、これは直せん。', 'normal'),
        say('olga', '直すのは、店主のほうだ。'),
        say('olga', '……おっと、余計なことを言った。'),
        say('olga', '俺は、道具の話だけしてりゃいい。', 'smile'),
        set((s) => {
          s.flags.clock_secret = true;
          s.trust.olga = (s.trust.olga ?? 0) + 2;
        }),
        exit('olga'),
        jump('n3c'),
      ],
    },
    {
      id: 'n3b2',
      bg: 'cafe-counter',
      lines: [
        nar('オルガは、一口飲んで、眉をひそめた。'),
        say('olga', '……悪くはない。', 'think'),
        say('olga', 'だが、俺の今の頭には、足りん。'),
        say('olga', '苦味が要る。それと、体が起きる辛みだ。'),
        say('olga', 'コーヒーをベースにして、ジンジャーを足してみな。', 'normal'),
        say('olga', '……あ、これを飲みきるから、作り直しはいい。'),
        nar('彼は、本当に飲みきってから、工具を開けた。'),
        trustUp('olga', 1),
        exit('olga'),
        jump('n3c'),
      ],
    },
    {
      id: 'n3c',
      title: '「好き」の定義',
      bg: 'cafe-night',
      lines: [
        sfx('bell'),
        enter('mira', 'center', 'think'),
        say('mira', 'こんばんは。'),
        say('mira', '……前回のデータを持ってきました。', 'normal'),
        say('mira', '私は、あのあと、街の飲み物という飲み物を試しました。'),
        say('mira', '自動販売機が、特に、便利でした。'),
        say('mira', '甘い、酸っぱい、苦い、炭酸。'),
        say('mira', 'どれも、数値が、出ました。', 'think'),
        say('mira', 'でも、あの夜、ここで飲んだものだけ、数値が出なかった。', 'normal'),
        say('mira', 'だから、もう一度、お願いします。'),
        say('mira', '今度は、注文しません。'),
        say('mira', '私のために、あなたが選んでください。', 'shy'),
        say('mira', '……それが、いちばん、いびつなデータなので。'),
        heart('（いびつなデータ、という言葉に、少しだけ笑ってしまった。）'),
        order({
          order: { kind: 'free', id: 'n3-mira-1', label: 'おまかせ（ミラの「好き」を探す）' },
          customer: 'mira',
          hint: 'ミラ：おまかせ。あなたが選んだ一杯が、彼女の「好き」になる。',
          results: { perfect: 'n3d', good: 'n3d', off: 'n3d' },
        }),
      ],
    },
    {
      id: 'n3d',
      bg: 'cafe-counter',
      lines: [
        set((s) => {
          s.flags.mira_favorite = String(s.flags['lastDrink:n3-mira-1'] ?? '');
        }),
        nar('ミラは、カップを両手で受け取った。'),
        nar('飲む前に、いつものように、香りを「聴く」。'),
        nar('それから、一口。'),
        nar('二口目は、少しだけ、ゆっくりだった。'),
        say('mira', '……', 'surprise'),
        say('mira', 'あの。これ、なんですか。', 'surprise'),
        say('mira', 'とても、記録に、残したい味です。'),
        say('mira', '酸味とか、苦味とか、そういう名前をつけると、消えてしまう。', 'shy'),
        say('mira', 'なので、名前をつけません。'),
        say('mira', 'この味を、「好き」と呼ぶことにします。', 'smile'),
        heart('（学習中のアンドロイドが、いちばん人間らしい顔をしていた。）'),
        say('mira', '……学習、完了です。', 'normal'),
        say('mira', '次に来たときは、これを、注文します。'),
        say('mira', 'もし、忘れてしまっても、あなたが覚えていてください。'),
        set((s) => {
          s.flags.mira_likes = true;
          s.trust.mira = (s.trust.mira ?? 0) + 3;
        }),
        exit('mira'),
        jump('n3e'),
      ],
    },
    {
      id: 'n3e',
      title: '雨に降られた話',
      bg: 'cafe-window',
      lines: [
        nar('窓の外で、風が鳴った。'),
        nar('片手に、傘を持っていない人が、立てかける形で立っている。'),
        enter('yuki', 'center', 'sad'),
        say('yuki', '……こんばんは。', 'sad'),
        nar('ユキだった。髪の先から、しずくが落ちている。'),
        nar('雪女が、雨に濡れている。'),
        say('yuki', '小説、読み合わせに、出しました。', 'tired'),
        say('yuki', '……だめでした。'),
        say('yuki', '「主人公が、動かない」って。'),
        say('yuki', '「何も起こらない」って。'),
        say('yuki', '「眠れないだけの話は、読む人の時間を、使わせる」って。'),
        nar('彼女は、カウンターの端に、指を置いて、ちょっと押した。'),
        say('yuki', '……正しいんです。', 'sad'),
        say('yuki', '正しいから、こたえるんです。', 'tired'),
        choice(
          [
            {
              text: '「眠れないだけの時間を、書いたんですね」',
              set: (s) => {
                s.flags.yuki_understood = true;
                s.trust.yuki = (s.trust.yuki ?? 0) + 2;
              },
              to: 'n3f',
            },
            {
              text: '「今夜は、温かいものを」',
              set: (s) => {
                s.trust.yuki = (s.trust.yuki ?? 0) + 1;
              },
              to: 'n3f',
            },
            {
              text: '何も言わずに、タオルを出す',
              set: (s) => {
                s.trust.yuki = (s.trust.yuki ?? 0) + 2;
              },
              to: 'n3f',
            },
          ],
          'どう返す?',
        ),
      ],
    },
    {
      id: 'n3f',
      bg: 'cafe-window',
      lines: [
        nar('ユキは、しばらく、何も言わなかった。'),
        nar('やがて、カウンターに両腕を乗せて、小さく言った。'),
        say('yuki', '……今日、飲み物、お願いできますか。', 'shy'),
        say('yuki', '冷たいの以外で。'),
        say('yuki', 'あったかくて、甘いの。'),
        say('yuki', '……自分で言って、いちばん、びっくりしています。', 'shy'),
        order({
          order: profileOrder({
            id: 'n3-yuki-1',
            label: '温かくて、甘いもの',
            from: ['milk', 'caramel'],
            temperature: 'hot',
          }),
          customer: 'yuki',
          hint: 'ユキ：今夜は甘いものを求めた。ミルク＋キャラメル／チョコ系。',
          results: { perfect: 'n3g', good: 'n3g', off: 'n3g2' },
        }),
      ],
    },
    {
      id: 'n3g',
      bg: 'cafe-dawn',
      lines: [
        nar('カップを受け取って、彼女は、両手を、しばらく離さなかった。'),
        say('yuki', '……あったかい。', 'smile'),
        say('yuki', '手だけじゃなくて、口の中まで、あったかい。'),
        say('yuki', '雪女なのに、って、言わないでくださいね。', 'shy'),
        say('yuki', '……書きます。もう少しだけ、書きます。', 'normal'),
        say('yuki', '読まれないかもしれないけど、それは、あとで、こわがります。'),
        say('yuki', 'いまは、あったかいので。'),
        set((s) => {
          s.flags.yuki_continues = true;
        }),
        jump('n3h'),
      ],
    },
    {
      id: 'n3g2',
      bg: 'cafe-dawn',
      lines: [
        say('yuki', '……これは、これで、おいしいです。'),
        say('yuki', 'でも、今日、ほしかったのは、もっと、まるい甘さでした。', 'shy'),
        say('yuki', 'ミルクに、甘いものを、ひとつ。'),
        say('yuki', '……次は、そう、頼みます。'),
        trustUp('yuki', 1),
        jump('n3h'),
      ],
    },
    {
      id: 'n3h',
      bg: 'cafe-dawn',
      lines: [
        exit('yuki'),
        nar('雨が、止んでいた。'),
        nar('濡れた路面に、朝の光が、まだ届いていない。'),
        enter('garnet', 'right', 'tired'),
        say('garnet', '……時計、見た?', 'normal'),
        say('garnet', 'オルガさんが、あれこれ触ってたでしょう。'),
        say('garnet', 'あれは、わざと止めてあるの。'),
        heart('（わざと。）'),
        say('garnet', 'この店、夜だけ開いてるでしょ。'),
        say('garnet', '零時から、夜明けまで。'),
        say('garnet', '時計が進まなければ、夜は、ずっと、ここにある。', 'tired'),
        say('garnet', '……私、夢を見ないのよ。', 'normal'),
        say('garnet', '獏だから。夢を食べる側で、見る側じゃないの。'),
        say('garnet', 'だから、夜が終わるのが、少しだけ、いや。', 'tired'),
        say('garnet', 'やだな。重い話をしてしまった。'),
        say('garnet', '……あなたが淹れると、この店の中の時間が、ちゃんと動く。'),
        say('garnet', 'それだけ、言っておきたかったの。', 'smile'),
        set((s) => {
          s.flags.garnet_dream = true;
          s.trust.garnet = (s.trust.garnet ?? 0) + 1;
        }),
        chapterCard('第四章', '夢の話'),
        jump('n4a'),
      ],
    },
  ],
};