# WEST 口コミ APP — 発表・共有用 URL 一覧

担当者の方へ。画面共有・デモ・社内確認用に、そのままコピーして使える URL です。

---

## 1. 会員向けサイト（スマホで開く）

| 用途 | URL |
|------|-----|
| **WEST 入口（ブランド選択）** | https://joyfit-review.vercel.app/west |
| JOYFIT24（WEST） | https://joyfit-review.vercel.app/west/joyfit |
| FIT365（WEST） | https://joyfit-review.vercel.app/west/fit365 |
| **発表デモ用（テスト店舗）** | https://joyfit-review.vercel.app/west/sample |

**参考（EAST・既存運用）**  
https://joyfit-review.vercel.app/

---

## 2. 発表デモのおすすめ

**テスト店舗ページ**（店頭 QR・店舗一覧には出ません）

https://joyfit-review.vercel.app/west/sample

- 店舗名：**JOYFIT24関西**
- 回答は WEST スプレッドシートに保存されます
- 低評価（星1〜3）の通知先：`r-kusaka@okamoto-group.co.jp`
- 高評価（星4〜5）の口コミ URL は**デモ用に仮設定**（経堂の Google 口コミページ）

### デモの流れ（例）

1. 上記 URL をスマホで開く
2. 会員情報・星評価を入力 → 口コミ文を生成
3. **「Google口コミページを開く」** を1回タップ → 保存＋口コミページ（別タブ）
4. 星3以下なら「メールアプリで問い合わせる」が表示される
5. スプレッドシートに `回答_JOYFIT24関西_kansai` タブが増えることを見せる
6. ポイント付与管理画面で付与チェックを見せる（下記 §3）

※ 会員番号は**未使用の10桁**で試してください（同じ番号は2回目以降不可）。

---

## 3. 管理者向け

| 用途 | URL |
|------|-----|
| **WEST スプレッドシート（店舗マスタ・回答）** | https://docs.google.com/spreadsheets/d/1OibrErQsRQYVsqCs6E9SdiQYOGs3KlMVgTyLOfw4IH8/edit |
| **ポイント付与管理画面** | https://script.google.com/macros/s/AKfycbxMrMSZe8XdD869thfm1DD0EsoGDe5MC7s2Sctf48oblffvb-6bcCRMuN2Y7YHv0a0j/exec?page=points |
| GAS スクリプト（開発者用） | https://script.google.com/home/projects/1lFwPxuVw9tx4-LS7fJ19kwiKXHmi8VLW2XgX1WM0au_FQZea5dBrjg3c/edit |

### スプレッドシート「店舗データ」の列

| 列 | 内容 |
|----|------|
| A | 店舗名 |
| B | Google口コミURL |
| C | 低評価通知メール |
| D | 店舗ID |
| E〜I | 住所・緯度・経度・検索用・特典文言 |

---

## 4. バナー画像（POP 等）

https://joyfit-review.vercel.app/west-kuchikomi-banner.png

---

## 5. EAST との違い（説明用メモ）

| 項目 | EAST | WEST |
|------|------|------|
| サイト | `/` から | `/west` から |
| 店舗データ | 別スプレッドシート | 別スプレッドシート |
| YOGA | あり | **なし** |
| データ混在 | なし（完全分離） | なし（完全分離） |

店頭 POP・QR には **WEST 店舗は `/west/joyfit` など WEST 用 URL のみ** を載せる想定です。

---

## 6. いまの状態（発表前に知っておくこと）

| 項目 | 状態 |
|------|------|
| 画面・送信フロー | 動作確認済み |
| テスト店舗（JOYFIT24関西） | デモ用 URL あり |
| 関西の本番店舗（西梅田など） | シートに登録済み。**B列（口コミURL）・C列（通知メール）は未入力の店舗あり** |
| 本番店舗のサイト表示 | B列が空の店舗は一覧に出ない仕様 |

本番店舗を一覧に出すには、スプレッドシート **B列・C列** を埋めてください。

---

## 7. 技術メモ（必要な人向け）

| 項目 | 値 |
|------|-----|
| Script ID | `1lFwPxuVw9tx4-LS7fJ19kwiKXHmi8VLW2XgX1WM0au_FQZea5dBrjg3c` |
| Web App URL | `https://script.google.com/macros/s/AKfycbxMrMSZe8XdD869thfm1DD0EsoGDe5MC7s2Sctf48oblffvb-6bcCRMuN2Y7YHv0a0j/exec` |
| Vercel 環境変数 | `STORES_JSON_URL_WEST` |

---

*最終更新：2026年8月*
