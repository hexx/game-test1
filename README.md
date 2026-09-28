# 真夜中ブレンド / Midnight Blend

深夜の喫茶店「カフェ・ノクターナル」で、眠れない客たちに一杯を出すビジュアルノベル。
『Coffee Talk』のような「深夜喫茶 × 会話 × 飲み物づくり」の遊びを、**ブラウザだけで動くオリジナル作品**として作り直したものです
（ストーリー・キャラクター・絵・音はすべてこのリポジトリ内で生成しています。外部アセットはありません）。

- 公開先: Cloudflare Workers（静的アセット + 小さな API）
- 依存: Vite / TypeScript のみ。画像・音声ファイルはゼロ（背景・立ち絵・BGM・効果音はすべて SVG / WebAudio による手続き生成）

## 遊びかた

1. タイトルで「はじめから」→ バリスタの名前を決める
2. 客の話を聴き、**材料（ベース1つ＋アレンジ2つまで）と温度**を選んで一杯を淹れる
3. 注文との一致度が「完璧 / まずまず / ちがう」で返り、常連たちとの距離（信頼度）が変わる
4. 夜は全6章。最後の夜の返事と、それまでの腕でエンディングが分岐（3種類）

### 操作

タイトルの「あそびかた」、またはゲーム中の右上「？」から、いつでも同じ説明を読めます（初回は自動で開きます）。

| 操作 | 内容 |
| --- | --- |
| クリック / スペース / Enter | セリフを進める（表示中にもう一度押すと全文表示） |
| AUTO | 自動送り |
| SKIP / Ctrl 押しっぱなし | 早送り（選択肢と注文では止まる） |
| 履歴 | これまでのセリフ |
| レシピ帳 | 発見したレシピ・店主のメモ・記録 |
| MENU / Esc | セーブ・ロード・設定・タイトルへ |

### 味の仕組み

材料は 14 種類（コーヒー / 紅茶 / 緑茶 / チョコレート / ミルク / はちみつ / シナモン / ジンジャー / ミント / レモン / ナッツ / キャラメル / バニラ / チリ）。
6軸（苦味・甘味・酸味・香辛・香り・まろやか）の味が加算され、**材料が増えるほど薄まる**モデルです。
組み合わせには「カフェラテ」「山の紅茶」のような署名レシピが 30 種類あり、初めて淹れるとレシピ帳に記録されます。

注文は3タイプ:

- `exact` — 材料まで指定（「紅茶＋レモン＋はちみつ／温かい」）
- `profile` — 味の指定（「冷たくて、苦いもの」）。レーダーの目標（破線）に近づける
- `free` — おまかせ。選んだ一杯が、その人の「好き」になる

## 開発

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # 味判定・エンジン・シナリオ構造・DOMスモーク
npm run typecheck
npm run build      # dist/ を生成
npm run cf-dev     # Cloudflare Workers（workerd）でローカル実行 → http://localhost:8787
```

ディレクトリ:

```
src/game/          ゲームのロジック（材料・判定・エンジン・セーブ）
src/game/script/   シナリオ（章ごとのファイル）
src/ui/            画面（SVG立ち絵・背景・淹れるパネル・各パネル）
src/audio/         WebAudio による BGM / 環境音 / 効果音
src/worker.ts      Cloudflare Workers のエントリ（アセット配信 + 任意の集計API）
tests/             vitest
docs/specs/deploy.md  本番反映の手順とダッシュボード設定の写し
```

## デプロイ（Cloudflare Workers）

本番反映は **Cloudflare Workers Builds（production branch = `main`）に一本化**しています。
手元からの `npm run deploy` は `scripts/deploy-guard.mjs` が止めます（緊急時のみ `ALLOW_LOCAL_DEPLOY=1`）。

```bash
# 初回のみ: Cloudflare 側で Git リポジトリを接続
#   Build command: npm run build
#   Deploy command: npm run deploy
#   Non-production branch builds: 無効
```

詳細・ロールバック・検証項目は [`docs/specs/deploy.md`](docs/specs/deploy.md) を参照。

### 任意: エンディングの集計（KV）

「みんなの記録」を有効にしたい場合だけ:

```bash
npx wrangler kv namespace create ENDINGS
# 出力された id を wrangler.jsonc の kv_namespaces に貼る
```

未設定でもデプロイは成功し、`/api/endings` は 501、ゲーム側は静かに無効化します。

## 開発メモ（つまずきやすい点）

- `hidden` 属性はブラウザ既定（UAオリジン）のスタイルなので、**作者CSSの `display` 指定に負ける**。
  `.overlay { display: grid }` のような指定があると `hidden` が効かず、「透明な全画面オーバーレイが
  クリックを吸い続ける」事故になる。そのため `src/styles.css` の先頭で
  `[hidden] { display: none !important; }` を宣言し、`tests/css-contract.test.ts` で担保している。
- 立ち絵の位置（`center/left/right`）は同じ章のなかで重複させない。
  `tests/staging.test.ts` が検出する（章の変わり目は物語側が舞台を空にする）。
- シナリオのジャンプ先・材料の実在・通し再生は `tests/script.test.ts` が見ている。

## ライセンス / 注意

- このリポジトリのコードとシナリオはオリジナルです。『Coffee Talk』（Toge Productions）とは無関係です。
- 外部フォント・画像・音声を読み込まないため、オフラインでも遊べます（セーブは localStorage）。