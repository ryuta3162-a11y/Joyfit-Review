# WEST 口コミ APP — 発表・共有用 URL 一覧

担当者の方へ。画面共有・デモ・社内確認用に、そのままコピーして使える URL です。

---

## 1. 会員向けサイト（LP・アンケート）

| 用途 | URL |
|------|-----|
| **WEST 入口（ブランド選択）** | https://joyfit-review.vercel.app/west |
| JOYFIT24（WEST） | https://joyfit-review.vercel.app/west/joyfit |
| **FIT365（WEST）** | https://joyfit-review.vercel.app/west/fit365 |
| FIT365 店舗選択 | https://joyfit-review.vercel.app/west/fit365/select-store |
| **スタッフ試験用（JOYFIT24サンプル）** | https://joyfit-review.vercel.app/west/sample |

**参考（EAST・既存運用）**  
https://joyfit-review.vercel.app/

---

## 2. 管理シート（店舗マスタ・回答）

| 用途 | URL |
|------|-----|
| **WEST 管理スプレッドシート** | https://docs.google.com/spreadsheets/d/1OibrErQsRQYVsqCs6E9SdiQYOGs3KlMVgTyLOfw4IH8/edit |

シート「店舗データ」の列（EASTと同じ）：

| 列 | 内容 |
|----|------|
| A | 店舗名 |
| B | Google口コミURL |
| C | 低評価通知メール |
| D | 店舗ID |
| E | 住所 |
| F | 緯度 |
| G | 経度 |
| H | 検索用 |
| I | 特典文言 |

- **2行目**：`JOYFIT24サンプル`（スタッフ試験用。店舗一覧には出ません）
- **3行目以降**：本番店舗

---

## 3. 管理者向け（ポイント付与・社内専用）

| 用途 | URL |
|------|-----|
| **ポイント付与管理（DOMAIN制限）** | https://script.google.com/a/macros/okamoto-group.co.jp/s/AKfycbyL-3wzHb-JHDwm_kpI1nKOXxAXrx8E7xLZjnGN5_Ax6f6GQcZ4LZedHnnGwQ9mrR0C/exec |

※ 公開アンケートGASとは別プロジェクトです。岡本グループのGoogleアカウントでのみ開けます。

---

## 4. EAST との違い

| 項目 | EAST | WEST |
|------|------|------|
| サイト | `/` から | `/west` から |
| 店舗データ | 別スプレッドシート | 別スプレッドシート |
| ポイント管理 | 別GAS・DOMAIN | 別GAS・DOMAIN |
| YOGA | あり | **なし** |

---

## 5. 技術メモ

| 項目 | 値 |
|------|-----|
| 公開GAS Script ID | `1lFwPxuVw9tx4-LS7fJ19kwiKXHmi8VLW2XgX1WM0au_FQZea5dBrjg3c` |
| 公開 Web App URL | `https://script.google.com/macros/s/AKfycbxMrMSZe8XdD869thfm1DD0EsoGDe5MC7s2Sctf48oblffvb-6bcCRMuN2Y7YHv0a0j/exec` |
| ポイント管理 Script ID | `1e7QhCRwE4OzrnSDBRGSJZNUBUV3zSK_VeS5-bnmvS9XQ0ey1KqJNFIk1` |
| Vercel 環境変数 | `STORES_JSON_URL_WEST` |

---

*最終更新：2026年8月*
