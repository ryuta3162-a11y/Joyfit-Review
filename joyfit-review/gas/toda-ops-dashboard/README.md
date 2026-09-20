# 戸田 見学体験 運用ダッシュボード（社内専用 GAS）

公開アンケート GAS とは別です。FIT365 戸田新曽のスタッフが、回答の対応と個別会費調整を付ける画面です。

| 項目 | 値 |
|------|------|
| 運用画面 | https://script.google.com/macros/s/AKfycbzEREFmphgtdKM-IGfttR2_xMLPdJUXsNPLMBse728-B9tgPl0YujfMv5q9kfiNmXwb/exec |
| エディタ | https://script.google.com/d/17lBmxyn0pjQGfpbsGD7VlVRZzEa_8-YOkYLxNiQ7dQQwPk3hqJYOPWxY/edit |
| Script ID | `17lBmxyn0pjQGfpbsGD7VlVRZzEa_8-YOkYLxNiQ7dQQwPk3hqJYOPWxY` |
| データ | https://docs.google.com/spreadsheets/d/1jkYhtkXaxqV5-BPpTkeR0HNm6NNXjA8gxC2-0LKKjnY/edit |
| 対象タブ | `戸田_回答` |
| 公開アンケート | https://joyfit-review.vercel.app/newstore/toda |

## アクセス

- 未ログイン → Google ログイン
- 岡本グループ外 → 入れない（DOMAIN）

## 初回だけ必要な権限許可

1. [Apps Script](https://script.google.com/d/17lBmxyn0pjQGfpbsGD7VlVRZzEa_8-YOkYLxNiQ7dQQwPk3hqJYOPWxY/edit) を開く
2. 関数 `listTodaOpsRows` を実行してスプレッドシート権限を許可
3. [運用画面](https://script.google.com/macros/s/AKfycbzEREFmphgtdKM-IGfttR2_xMLPdJUXsNPLMBse728-B9tgPl0YujfMv5q9kfiNmXwb/exec) を社内Googleで開く

```powershell
cd joyfit-review/gas/toda-ops-dashboard
clasp push --force
clasp deploy -d "toda-ops"
```
