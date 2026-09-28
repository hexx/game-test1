import type { Chapter } from '../types';
import {
  branch,
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
 * 第四章：夢の話
 *   セラ（通知の返事）→ ルカ（決意）→ ガーネットの依頼
 */
export const NIGHT4: Chapter = {
  id: 'night4',
  title: '第四章',
  subtitle: '夢の話',
  start: 'n4a',
  scenes: [
    {
      id: 'n4a',
      title: '通知',
      bg: 'cafe-night',
      lines: [
        nar('今夜の街は、霧が出ている。'),
        nar('ランプの光が、窓のところで、輪になって止まっている。'),
        sfx('bell'),
        enter('sera', 'center', 'normal'),
        say('sera', 'こんばんは。'),
        say('sera', '……先日は、失礼しました。', 'normal'),
        say('sera', '手紙を、その場で開けなかったので。'),
        say('sera', '家に帰って、開けました。'),
        nar('彼女は、カウンターに、一通の封筒を置いた。'),
        nar('開封済み。中身は、もう入っていない。'),
        say('sera', '祖母の家が、売れることになりました。', 'tired'),
        say('sera', '村に、もう誰もいないんです。'),
        say('sera', 'そういう通知でした。'),
        say('sera', '契約書なら、三日で片づける案件です。'),
        say('sera', '私の署名が、一行、あれば終わる。', 'normal'),
        say('sera', '……それが、まだ、できていません。', 'tired'),
        say('sera', 'だから、今日は、苦いものをもらいます。'),
        say('sera', '後味が、長いやつ。', 'normal'),
        say('sera', '甘いものが、いらない夜なんです。'),
        order({
          order: {
            kind: 'exact',
            id: 'n4-sera-1',
            label: '苦くて、後味が長いもの',
            ingredients: ['coffee', 'chocolate'],
            temperature: 'hot',
          },
          customer: 'sera',
          hint: 'セラ：コーヒー＋チョコレート／温かい（ビターモカ）。',
          results: { perfect: 'n4b', good: 'n4b', off: 'n4b2' },
        }),
      ],
    },
    {
      id: 'n4b',
      bg: 'cafe-counter',
      lines: [
        nar('セラは、カップを見て、それから、封筒を見た。'),
        say('sera', '……これは、強い。', 'normal'),
        say('sera', '苦味が、後ろから追いかけてくる。'),
        say('sera', 'いいですね。逃げられなくて。', 'smug'),
        nar('一口、また一口。'),
        say('sera', '祖母は、署名というものを、いちばん嫌った人でした。'),
        say('sera', '村の決めごとは、ぜんぶ、口約束で。'),
        say('sera', '「紙に書いたら、それで終わりだ」と言って。'),
        say('sera', '……私は、紙に書く仕事を選んだ。', 'tired'),
        say('sera', '他人の決めごとを、終わらせる仕事です。'),
        say('sera', 'だから、自分のだけが、終わらない。'),
        choice(
          [
            {
              text: '「家を、残す方法はありませんか」',
              set: (s) => {
                s.trust.sera = (s.trust.sera ?? 0) + 2;
                s.flags.sera_ask = true;
              },
            },
            {
              text: '「署名しない、という選択も」',
              set: (s) => {
                s.trust.sera = (s.trust.sera ?? 0) + 1;
              },
            },
            {
              text: '何も言わずに、おかわりを淹れる',
              set: (s) => {
                s.trust.sera = (s.trust.sera ?? 0) + 2;
                s.flags.sera_refill = true;
              },
            },
          ],
          'どう返す?',
        ),
        branch(
          (s) => Boolean(s.flags.sera_refill),
          [
            nar('二杯目を淹れる。同じ材料で、温度だけ、少し変えた。'),
            say('sera', '……二杯目を出すバリスタは、はじめてです。', 'surprise'),
            say('sera', 'たいてい、人は、私の話が長いと、逃げますから。'),
            say('sera', '……ありがとう。', 'smile'),
          ],
          [
            say('sera', '……考えます。', 'normal'),
            say('sera', '考える、というのは、私の職務には無い工程で。'),
            say('sera', 'だから、たぶん、それが、答えなんでしょう。', 'smile'),
          ],
        ),
        say('sera', '……この店には、夜が明けるまで、いていいんでしたね。', 'normal'),
        say('sera', '今日は、いさせてください。'),
        exit('sera'),
        jump('n4c'),
      ],
    },
    {
      id: 'n4b2',
      bg: 'cafe-counter',
      lines: [
        say('sera', '……これは、甘いですね。', 'smug'),
        say('sera', '私の言い方が、抽象的すぎましたか。'),
        say('sera', '「甘いものはいらない」。だから、ミルクも、蜜も、入れない。', 'normal'),
        say('sera', 'コーヒーと、それから——後味を残すのは、カカオです。'),
        trustUp('sera', 1),
        exit('sera'),
        jump('n4c'),
      ],
    },
    {
      id: 'n4c',
      title: '決めた人',
      bg: 'cafe-night',
      lines: [
        nar('端の席から、ベースの音が、小さく鳴った。'),
        nar('誰かを起こさないくらいの、低い音。'),
        enter('luca', 'center', 'smile'),
        say('luca', 'よお。'),
        say('luca', '……聴こえたか? 弾いてた。', 'shy'),
        say('luca', 'あの夜から、毎日、触ってる。'),
        say('luca', 'で、決めた。'),
        say('luca', '続ける。続けられる範囲で、続ける。', 'normal'),
        say('luca', '就職もする。昼の仕事だ。ベースは夜に弾く。'),
        say('luca', 'そういう、ずるい生き方をする。'),
        say('luca', '……あんたが、「鳴ってるなら、続ければいい」って言ったからな。'),
        branch(
          (s) => Boolean(s.flags.luca_push),
          [
            say('luca', 'はっきり言ってくれたから、決められた。', 'smile'),
            say('luca', '言われなかったら、たぶん、まだ迷ってた。'),
          ],
          [
            say('luca', '……言い方は、覚えてないんだよ。'),
            say('luca', 'でも、楽になったことだけ、覚えてる。', 'smile'),
          ],
        ),
        say('luca', 'ガーネットさんに話したら、「じゃあ、店でやれば」って。', 'happy'),
        say('luca', 'この店で、ライブ。次の、休みの夜に。'),
        say('luca', '集まるやつには、声かけた。ユキさんも、ミラも、ノアも。'),
        say('luca', '……あんたも、客じゃなくて、店側だが。', 'smile'),
        say('luca', '来るだろ?'),
        heart('（来ると言った。）'),
        say('luca', 'よし。じゃあ、今日は、その……'),
        say('luca', '苦いの、頼む。', 'shy'),
        say('luca', '冷たいやつ。コーヒー。'),
        say('luca', '前は、苦いの、わかんなかったんだよ。'),
        say('luca', '犬は、甘いのが正義だろ。', 'smile'),
        order({
          order: {
            kind: 'exact',
            id: 'n4-luca-1',
            label: '冷たい、苦いコーヒー',
            ingredients: ['coffee'],
            temperature: 'iced',
          },
          customer: 'luca',
          hint: 'ルカ：コーヒーのみ／アイス。',
          results: { perfect: 'n4d', good: 'n4d', off: 'n4d2' },
        }),
      ],
    },
    {
      id: 'n4d',
      bg: 'cafe-night',
      lines: [
        say('luca', '……うわ、苦い。', 'surprise'),
        say('luca', 'くそ、これ、うまい。', 'happy'),
        say('luca', '大人になった気がする。'),
        say('luca', '二十五だけど。'),
        nar('彼は笑って、カウンターを二回叩いた。'),
        set((s) => {
          s.flags.luca_decided = true;
          s.trust.luca = (s.trust.luca ?? 0) + 2;
        }),
        exit('luca'),
        sfx('bell'),
        jump('n4e'),
      ],
    },
    {
      id: 'n4d2',
      bg: 'cafe-night',
      lines: [
        say('luca', '……ん、これ、コーヒーじゃないだろ。', 'normal'),
        say('luca', '今の俺、苦いのがいい気分なんだよ。'),
        say('luca', 'コーヒーだけ。冷たいやつ。'),
        say('luca', '……あ、飲むよ。もったいないし、うまいし。'),
        nar('彼は飲みきって、それから、少しだけ、いい顔をした。'),
        trustUp('luca', 1),
        exit('luca'),
        sfx('bell'),
        jump('n4e'),
      ],
    },
    {
      id: 'n4e',
      title: '店主の依頼',
      bg: 'cafe-counter',
      lines: [
        nar('客が、ひとりもいなくなった。'),
        nar('壁の時計は、まだ零時。'),
        nar('ガーネットが、カウンターの向こうから、こちらを見ている。'),
        enter('garnet', 'center', 'tired'),
        say('garnet', '……ねえ。', 'normal'),
        say('garnet', 'あなたに、淹れてほしいものがあるの。'),
        say('garnet', '私のための、一杯。', 'tired'),
        say('garnet', '何でもいい。決めるのは、あなた。'),
        say('garnet', '……ずるいでしょ。そういう注文。', 'smile'),
        order({
          order: {
            kind: 'free',
            id: 'n4-garnet-1',
            label: '店主のための一杯（おまかせ）',
          },
          customer: 'garnet',
          hint: 'ガーネット：おまかせ。あなたが選んだ一杯。',
          results: { perfect: 'n4f', good: 'n4f', off: 'n4f' },
        }),
      ],
    },
    {
      id: 'n4f',
      bg: 'cafe-counter',
      lines: [
        set((s) => {
          s.flags.garnet_drink = String(s.flags['lastDrink:n4-garnet-1'] ?? '');
        }),
        nar('ガーネットは、カップを受け取って、少し、笑った。'),
        say('garnet', '……うん。', 'smile'),
        say('garnet', 'これ、私が、あなたに飲んでほしかった味。'),
        say('garnet', '獏は、夢を喰うの。'),
        say('garnet', 'だから、夢の話を聴くと、喰いたくなる。'),
        say('garnet', '喰った夢は、もう、私のものにならない。'),
        say('garnet', '……私は、百年、ここで、人の夢を喰ってきたの。', 'tired'),
        say('garnet', 'あなたたちが眠れない夜に、見かけた夢を。'),
        say('garnet', 'そしたら、自分の中に、何も残らなかった。'),
        say('garnet', '私は、何になりたかったのか。どこへ行きたかったのか。'),
        say('garnet', '……もう、わからない。', 'sad'),
        heart('（この人は、この店の中で、ずっと、ひとりで夜を止めていた。）'),
        say('garnet', 'だから、決めたの。', 'normal'),
        say('garnet', '私、この店を出ようと思う。'),
        say('garnet', '夢を探しに。私にも、あるかもしれないから。', 'smile'),
        say('garnet', 'あなた、ここに残る?', 'tired'),
        say('garnet', '……すぐにとは言わない。次の夜、答えを聞かせて。'),
        say('garnet', 'ライブの夜に、みんなが来る。'),
        say('garnet', 'みんなの前で、返事をして。'),
        say('garnet', 'それが、この店の、いちばん最後の注文だから。', 'smile'),
        set((s) => {
          s.flags.garnet_asked = true;
          s.trust.garnet = (s.trust.garnet ?? 0) + 2;
        }),
        nar('夜明けの光が、窓のところで、輪をほどいていく。'),
        chapterCard('終章', '夜明け前'),
        jump('f0'),
      ],
    },
  ],
};