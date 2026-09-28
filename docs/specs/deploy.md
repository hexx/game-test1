# 仕様：本番反映（Production Deploy）

この文書は「本番反映の手順」と「リポジトリの外にある設定の写し」をまとめたもの。
対象: `midnight-blend`（真夜中ブレンド / ブラウザゲーム）

## 1. 権威の所在

| 何を決めるか | 権威 |
| --- | --- |
| デプロイ手順の中身 | リポジトリ（`package.json` の `deploy`、`scripts/deploy-guard.mjs`） |
| いつ・どのブランチでビルドするか、build / deploy command、watch paths、API トークン | Cloudflare ダッシュボード（Workers & Pages → midnight-blend → Settings → Build） |
| 本番に出てよいか | CI（`.github/workflows/ci.yml`）＋ `main` の ruleset（必須ステータスチェック・PR 必須） |

ダッシュボードの設定は**リポジトリからは見えない**。§3 がその写しであり、変更したら必ずここも更新する。

## 2. 不変条件

- **本番で動いている成果物は `main` 先頭のコミットからビルドしたものである。** 成果物に影響する差分が入れば必ず本番反映が走る。
- 巻き戻しは **`git revert` → `main` へマージ**が正。ダッシュボードの promote / `wrangler rollback` は止血の例外で、使ったら必ず revert で追いつかせる。
- DB は無い（スキーマ反映の工程は無い）。唯一の動的状態は任意の KV（エンディング集計）で、**消えてもゲームは壊れない**。

## 3. Cloudflare Workers Builds の設定値（写し）

| 設定 | 値 |
| --- | --- |
| Git アカウント / リポジトリ | （接続時に記入） |
| production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Non-production branch builds | **無効**（preview trigger を作らない。preview は本番と同じ binding を共有するため） |
| Root directory | リポジトリ直下 |
| Path excludes | `docs/**` `issues/**` `*.md` `.github/**` |
| 環境変数 | 不要（`ASSETS` は wrangler.jsonc の assets binding、`ENDINGS` は任意の KV binding） |

`worker名`・`assets` の実値はリポジトリの `wrangler.jsonc` が権威（プレースホルダを置かない）。

## 4. 手順

### 通常（本番反映）

1. ブランチで作業し、PR を作る。
2. CI（`typecheck` / `test` / `build`）が緑になる。
3. `main` にマージ → Cloudflare Workers Builds が `npm run build` → `npm run deploy` を実行。
4. GitHub のチェックラン（`Workers Builds: midnight-blend`）と Cloudflare のビルド履歴で結果を確認する。

```
npm run build   # tsc --noEmit + vite build → dist/
npm run deploy  # deploy-guard → wrangler deploy
```

### 緊急時（手元から反映）

```
npm run build && ALLOW_LOCAL_DEPLOY=1 npm run deploy
```

実行後は必ず `git revert`（または差分を main へ追いつかせる）こと。手元からの反映は
「本番 = main 先頭」という不変条件の例外である。

### ロールバック

1. 原因コミットを `git revert` して `main` にマージ（自動で再デプロイされる）。
2. 止血が必要なときだけダッシュボードの promote / `wrangler rollback` を使い、その後 revert で追いつかせる。

## 5. 任意: エンディング集計（KV）

`/api/endings` を有効にすると「みんなの記録」が表示される。未設定でも 501 を返して
クライアント側が静かに無効化するため、デプロイは成功する。

```
npx wrangler kv namespace create ENDINGS
# 出力された id を wrangler.jsonc の kv_namespaces に貼る
```

## 6. 検証

- `npm run test`（エンジン・味判定のユニットテスト）
- `npm run typecheck`
- `npm run build` が成果物 `dist/` を生成する
- ローカルからの `npm run deploy` がガードで中止される（`ALLOW_LOCAL_DEPLOY=1` で例外）
- `npx wrangler dev` で `/api/health` が `{"ok":true,...}` を返す