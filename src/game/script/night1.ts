import { profileOrder } from '../ingredients';
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
} from './helpers';

/**
 * 第一章：眠れない者たち
 *   ルカ（人狼のベーシスト）→ ミラ（アンドロイド）
 */
export const NIGHT1: Chapter = {
  id: 'night1',
  title: '第一章',
  subtitle: '眠れない者たち',
  start: 'n1a',
  scenes: [
    {
      id: 'n1a',
      title: '午前零時、開店',
      bg: 'cafe-night',
      lines: [
        nar('カウンターの上の時計が、零時を指して止まった。'),
        nar('……止まった、というより、そこから先に進まないのだ。'),
        nar('ガーネットは「そのうち直るわ」と言って、コーヒーを淹れている。'),
        sfx('bell'),
        nar('ベルが鳴った。音が、少しだけ重い。'),
        enter('luca', 'center', 'tired'),
        say('luca', '……よお。', 'tired'),
        say('luca', '今日は、ここで寝ていいかな。', 'smile'),
        say('luca', '冗談。眠れないから来たんだよ。'),
        nar('肩に、楽器のケースを提げている。'),
        nar('背の高い人狼だった。耳が、少しだけ伏せられている。'),
        say('luca', 'ルカ。ベース弾き。', 'normal'),
        say('luca', 'この店、ベースが置けるから好きなんだ。'),
        say('luca', '……って、前から来てるから、知ってるか。'),
        heart('（どうやら、この店の常連らしい。）'),
        say('luca', '悪い、今日はなんか、あったかいやつ。', 'tired'),
        say('luca', '甘くて、まろやかで。'),
        say('luca', '……酒じゃなく、そういうので。'),
        order({
          order: profileOrder({
            id: 'n1-luca-1',
            label: '温かくて、甘くて、まろやかなもの',
            from: ['milk', 'honey'],
            temperature: 'hot',
          }),
          customer: 'luca',
          hint: 'ルカ：温かい、甘い、まろやか。ミルクとはちみつが近い。',
          results: { perfect: 'n1b', good: 'n1b', off: 'n1b2' },
        }),
      ],
    },
    {
      id: 'n1b',
      bg: 'cafe-counter',
      lines: [
        nar('カップを渡すと、彼は両手で持って、しばらく匂いを嗅いでいた。'),
        say('luca', 'あー……。', 'smile'),
        say('luca', 'これだ。この、甘いやつ。', 'smile'),
        say('luca', '耳が、少し落ち着く。犬っぽいだろ。'),
        say('luca', '嗅覚がいいと、街の音が全部、匂いで入ってくるんだ。'),
        say('luca', '雨の匂い、油の匂い、誰かの不安の匂い。'),
        say('luca', '夜は、ずっと賑やかで、うるさい。', 'tired'),
        jump('n1c'),
      ],
    },
    {
      id: 'n1b2',
      bg: 'cafe-counter',
      lines: [
        say('luca', '……ん。'),
        say('luca', '悪くねえけど、今日はこれじゃない。', 'normal'),
        say('luca', '疲れてるときは、もっと、こう……丸いやつがいいんだよ。'),
        say('luca', 'ミルクをベースにすると、たぶん、近くなる。'),
        say('luca', '……あ、作り直しはいいぜ。もったいないし。飲む。'),
        nar('彼は本当に、最後の一滴まで飲んだ。'),
        jump('n1c'),
      ],
    },
    {
      id: 'n1c',
      bg: 'cafe-night',
      lines: [
        say('luca', '……なあ。', 'think'),
        say('luca', 'バンド、続けようか迷ってる。'),
        say('luca', 'ベースの俺が決められないんだから、情けないけど。'),
        say('luca', 'メンバーは就職した。生活があるから、当然だ。'),
        say('luca', '俺も、昼に働けばいい。たぶん、それで、全部、片が付く。', 'tired'),
        nar('カップの縁を、爪でこつこつと叩いている。'),
        say('luca', 'でも、こういう音が、まだ鳴ってるんだよ。'),
        say('luca', '手の中と、頭の中と、両方で。'),
        choice(
          [
            {
              text: '「鳴ってるなら、続ければいい」',
              set: (s) => {
                s.trust.luca = (s.trust.luca ?? 0) + 1;
                s.flags.luca_push = true;
              },
            },
            {
              text: '「休んでも、音楽は逃げない」',
              set: (s) => {
                s.trust.luca = (s.trust.luca ?? 0) + 1;
              },
            },
            {
              text: '「どんな音? 聴いてみたい」',
              set: (s) => {
                s.trust.luca = (s.trust.luca ?? 0) + 2;
                s.flags.luca_play = true;
              },
            },
          ],
          'ルカは、返事を待っている。',
        ),
        branch(
          (s) => Boolean(s.flags.luca_play),
          [
            say('luca', '……いま?', 'surprise'),
            nar('彼はケースを開けた。弦が、ランプの光を拾って光った。'),
            say('luca', '音、大きいと思ったら、手で押さえて。'),
            nar('最初の一音が、店内の空気を、ゆっくりと押し広げた。'),
            nar('低い音だった。夜の底のような、深い音。'),
            nar('眠っているみたいに静かな店が、少しだけ、生き物になった。'),
            say('luca', '……どう?', 'shy'),
            heart('（うまいとか、下手とか、そういう話ではないと思った。）'),
            heart('（誰かが、眠れない時間を、音に変えているだけだった。）'),
            say('luca', '……ありがとう。', 'smile'),
            say('luca', '誰にも聴かせてなかった。こんなん、恥ずかしいから。'),
            set((s) => {
              s.flags.heard_luca = true;
            }),
          ],
          [
            say('luca', '……そうだな。', 'think'),
            say('luca', '正しいこと言うなよ、バリスタ。'),
            say('luca', 'でも、そう言われて、ちょっと楽になった。'),
            say('luca', '明日、たぶん、ベース触る。'),
          ],
        ),
        say('luca', '……あ、そうだ。今度、ここで弾かせてくれよ。', 'smile'),
        say('luca', '店でライブ。似合うだろ、この店。'),
        sfx('bell'),
        say('luca', '……お、次の客だ。俺はそろそろ、端っこの席にいる。', 'normal'),
        exit('luca'),
        jump('n1d'),
      ],
    },
    {
      id: 'n1d',
      title: 'はじめての味',
      bg: 'cafe-night',
      lines: [
        nar('入ってきたのは、動作のきれいな女だった。'),
        nar('髪の一部が、ランプの光を反射して、ほんの少しだけ虹色に光る。'),
        enter('mira', 'center', 'normal'),
        say('mira', 'こんばんは。'),
        say('mira', '……ええと、いま、扉の前に、待機列はありませんでした。'),
        say('mira', 'なので、入室しました。'),
        heart('（ものすごく真面目な人だ。）'),
        say('mira', 'ミラです。', 'normal'),
        say('mira', 'アンドロイドです。お客様対応の学習をしています。'),
        say('mira', '……いちど、学習のために、聞いてもいいですか。'),
        say('mira', '「好きな味」というのは、どこから来るんですか。', 'think'),
        say('mira', '私は、甘い、酸っぱい、苦い、と分類できます。'),
        say('mira', 'でも、分類と、好きは、違うみたいなんです。'),
        say('mira', 'だから、データがほしい。最初の「好き」の。'),
        say('mira', '酸味があって、香りの高いもの。', 'normal'),
        say('mira', '人が、いちばん最初に好きになるのは、たぶん、そういう味だと思うので。'),
        order({
          order: profileOrder({
            id: 'n1-mira-1',
            label: '酸味があって、香りの高いもの',
            from: ['tea', 'lemon'],
            temperature: 'hot',
          }),
          customer: 'mira',
          hint: 'ミラ：酸味＋香り。紅茶＋レモンがどんぴしゃ。',
          results: { perfect: 'n1e', good: 'n1e', off: 'n1e2' },
        }),
      ],
    },
    {
      id: 'n1e',
      bg: 'cafe-counter',
      lines: [
        nar('ミラは、カップを受け取る所作が、少しだけたどたどしい。'),
        nar('飲む前に、一度、香りを「聴く」ように顔を近づけた。'),
        say('mira', '……香り、記録しました。', 'normal'),
        nar('一口。'),
        nar('数秒の間。店内の音が、止まったように感じた。'),
        say('mira', '……', 'surprise'),
        say('mira', 'あの。', 'surprise'),
        say('mira', 'いま、数値が、うまく出ませんでした。', 'surprise'),
        say('mira', '酸味4.1、香り5.7、温度62度、糖度は……'),
        say('mira', '……その、数字より先に、あたたかい、というのが、来ました。', 'shy'),
        heart('（アンドロイドが、少しだけ顔を赤くしたように見えた。）'),
        say('mira', 'これが、好き、ですか。', 'think'),
        say('mira', '……保留にします。もう少し、データが要ります。'),
        say('mira', 'でも、これは、覚えておきます。', 'normal'),
        say('mira', '今日の味を、「最初」として。'),
        set((s) => {
          s.flags.mira_first = true;
          s.trust.mira = (s.trust.mira ?? 0) + 1;
        }),
        jump('n1f'),
      ],
    },
    {
      id: 'n1e2',
      bg: 'cafe-counter',
      lines: [
        say('mira', '……計測しました。', 'think'),
        say('mira', 'これはこれで、記録に値する味です。'),
        say('mira', 'ただ、たぶんこれは、「好き」ではありません。'),
        say('mira', '酸味と香り、両方の数値が高い飲み物が、私の仮説です。'),
        say('mira', '……紅茶と、それから果物の酸味。', 'normal'),
        nar('彼女は、メモを取るように、カップを見つめていた。'),
        set((s) => {
          s.trust.mira = (s.trust.mira ?? 0) + 1;
        }),
        jump('n1f'),
      ],
    },
    {
      id: 'n1f',
      bg: 'cafe-dawn',
      lines: [
        nar('ミラは、席に着いてから、ずっと、自分のカップを見ていた。'),
        nar('ルカは端の席で、ケースを膝に乗せて、目を閉じている。'),
        nar('眠っているわけではない。ただ、静かにしている。'),
        nar('窓の外が、細い線のように白くなってきた。'),
        enter('garnet', 'right', 'smile'),
        say('garnet', 'はい、おしまい。', 'smile'),
        say('garnet', 'よく働いたわ。'),
        say('garnet', '……あの二人、あなたのこと、気に入ったみたい。', 'normal'),
        say('garnet', '私の店は、客が客を連れてくるの。'),
        say('garnet', 'だから、あなたが淹れる一杯は、次の誰かの夜に、つながってる。'),
        say('garnet', '……それじゃ、また零時に。', 'smile'),
        nar('夜が明ける。街が、眠りに落ちていく。'),
        chapterCard('第二章', '雨の音'),
        jump('n2a'),
      ],
    },
  ],
};