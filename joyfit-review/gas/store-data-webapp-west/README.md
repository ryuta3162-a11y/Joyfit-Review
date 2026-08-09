# WEST（関西・西日本）口コミ GAS

関東（EAST: `store-data-webapp`）とは **別スプレッドシート／別スクリプト** です。

## ID

| 項目 | 値 |
|------|-----|
| スプレッドシート | https://docs.google.com/spreadsheets/d/1OibrErQsRQYVsqCs6E9SdiQYOGs3KlMVgTyLOfw4IH8/edit |
| Script ID | `1lFwPxuVw9tx4-LS7fJ19kwiKXHmi8VLW2XgX1WM0au_FQZea5dBrjg3c` |
| Web App URL | `https://script.google.com/macros/s/AKfycbxMrMSZe8XdD869thfm1DD0EsoGDe5MC7s2Sctf48oblffvb-6bcCRMuN2Y7YHv0a0j/exec` |
| Vercel env | `STORES_JSON_URL_WEST` |
| サイト入口 | https://joyfit-review.vercel.app/west |

## 初期セットアップ

Apps Script エディタで `setupWestWorkbook` を1回実行。

作成されるシート:

1. `はじめに` … 運用メモ＋バナー
2. `店舗データ` … 列ルールどおりのヘッダー（店舗行は未投入）
3. `_survey_dedup` / `_survey_member_codes` … 補助

## clasp

```bash
cd joyfit-review/gas/store-data-webapp-west
clasp push --force
```

ウェブアプリとしてデプロイ後、URL を WEST 用の `STORES_JSON_URL`（または別環境変数）に設定。

## バナー画像

`../../public/west-kuchikomi-banner.png`  
本番: `https://joyfit-review.vercel.app/west-kuchikomi-banner.png`
