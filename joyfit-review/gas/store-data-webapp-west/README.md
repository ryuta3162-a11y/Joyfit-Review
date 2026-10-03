# WEST（関西・西日本）口コミ GAS

関東（EAST: `store-data-webapp`）とは **別スプレッドシート／別スクリプト** です。
ポイント付与は **`points-admin-west`**（社内専用）へ分離済みです。

## ID

| 項目 | 値 |
|------|-----|
| スプレッドシート | https://docs.google.com/spreadsheets/d/1OibrErQsRQYVsqCs6E9SdiQYOGs3KlMVgTyLOfw4IH8/edit |
| Script ID | `1lFwPxuVw9tx4-LS7fJ19kwiKXHmi8VLW2XgX1WM0au_FQZea5dBrjg3c` |
| Web App URL | `https://script.google.com/macros/s/AKfycbxMrMSZe8XdD869thfm1DD0EsoGDe5MC7s2Sctf48oblffvb-6bcCRMuN2Y7YHv0a0j/exec` |
| ポイント付与管理 | https://script.google.com/a/macros/okamoto-group.co.jp/s/AKfycbyL-3wzHb-JHDwm_kpI1nKOXxAXrx8E7xLZjnGN5_Ax6f6GQcZ4LZedHnnGwQ9mrR0C/exec |
| Vercel env | `STORES_JSON_URL_WEST` |
| サイト入口 | https://joyfit-review.vercel.app/west |
| スタッフ試験 | https://joyfit-review.vercel.app/west/sample |

## 列規則（EASTと同じ・6行目ヘッダー / 7行目〜データ）

A ブランド（JOYFIT / FIT365） | B 店舗名（ブランド名なし） | C レビューURL | D 低評価通知メール | E 店舗ID | F 住所 | G 緯度 | H 経度 | I 検索用 | J 特典文言

- C列（レビューURL）が入っている店舗だけサイトに表示されます
- 回答はブランド別の `回答シート_JOYFIT` / `回答シート_FIT365` に入ります（storeId / storeName でフィルタ）
- 旧 `回答_*` タブは非表示のバックアップとして残しています
- メンテ用 action（`?format=json&action=...`）は `&key=`（git管理外 `AdminKey.gs`）が必要です
