# JOYFIT 口コミサポート（Next.js）

会員が店舗を選び、Google マップの口コミ投稿まで案内する社内向けの画面です。店舗一覧とメール送信の裏側は **Google Apps Script（GAS）**、公開URLは **Vercel** を想定しています。

## 「もう完成？」について

| 部分 | 状態 |
|------|------|
| **画面の流れ**（トップ → 店舗選択 → アンケート・口コミ案内） | 一通りそろっています |
| **店舗データ** | `STORES_JSON_URL` が **未設定**のときは、アプリ内の **サンプル店舗（経堂など）** だけが表示されます。本番の全店舗を出すには **環境変数で GAS の URL を指定**します |
| **アンケート送信・低評価メール** | GAS の **doPost** が動いている同じウェブアプリ URL が必要です。未設定だと送信系はエラーになります |

つまり「見た目と操作の骨格は完成に近いが、**本番データと送信は Vercel の設定と GAS のデプロイでオン**」というイメージです。

## Vercel で URL を作る手順（ざっくり）

1. このフォルダ `joyfit-review` を **GitHub のリポジトリ**に push する（まだなら）。
2. [Vercel](https://vercel.com/) にログインし、**Add New… → Project** でそのリポジトリを選ぶ。
3. **重要：Root Directory（ルートディレクトリ）** を **`joyfit-review`** にする。  
   リポジトリの親フォルダをそのまま繋いだ場合、ここを間違えるとビルドが失敗したり真っ白になります。
4. **Environment Variables（環境変数）** に、下記を入れる（本番用の値はご自身の GAS URL とメール）。
5. **Deploy** を押す。数分で `https://○○○.vercel.app` のような URL が付きます。

### 環境変数（名前はそのままコピペ）

| 名前 | 説明 |
|------|------|
| `STORES_JSON_URL` | GAS ウェブアプリの URL（**ベースのままでOK**。店舗一覧取得時はアプリ側で `format=json` を付けます） |
| `DEFAULT_LOW_RATING_EMAIL` | 任意。店舗ごとの通知メールが空のときのフォールバック |

ローカル用には `.env.example` をコピーして `.env` を作り、同じ名前で値を入れれば `npm run dev` で動作確認できます。

## よくあるつまずき

- **店舗がサンプルしか出ない** → `STORES_JSON_URL` が Vercel に入っているか、URL が正しいか確認。
- **送信ボタンでエラー** → GAS を「ウェブアプリ」として再デプロイし、**アクセスできるユーザー**が適切か、`doPost` が実装されているか確認。
- **ビルドエラー** → Vercel の Root Directory が **`joyfit-review`** か確認。

## 開発コマンド

```bash
npm install
npm run dev
npm run build
```

## フォルダの目安

- `app/` … ページ（トップ、`/select-store`、`/member/[店舗ID]`）
- `components/member/review-flow.tsx` … メインのアンケート・口コミ案内 UI
- `lib/stores-remote.ts` … 店舗 JSON の取得
- `gas/store-data-webapp/` … スプレッドシート連携用 GAS（エディタにコピーしてデプロイ）
