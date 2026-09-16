# 見学体験後アンケート GAS（経堂 / 戸田新曽）

画面URLは店舗ごと、回答は同じスプレッドシートです。既存の EAST / WEST 口コミ GAS とは別です。

| 項目 | 値 |
|------|------|
| 経堂 | https://joyfit-review.vercel.app/newstore/kyodo |
| 戸田新曽 | https://joyfit-review.vercel.app/newstore/toda |
| 回答シート | https://docs.google.com/spreadsheets/d/1jkYhtkXaxqV5-BPpTkeR0HNm6NNXjA8gxC2-0LKKjnY/edit |
| ウェブアプリ | https://script.google.com/macros/s/AKfycbyjyfr1fCvYQjvuFhLbkINwo7KUk8MhNwYALvXjecJ-zM5J1z4TfHJ0YnLHAQcmB-ZS6A/exec |
| Script ID（公開用） | `1t0Eb61QGViZ_WFphF9uZ6ApHgG3VSffvW1r_X6qLaWLDTfDL1w4gZ9V-` |
| シート紐付けスクリプト | `1925tdyQEaEb56Bsc_JliT5JFMHSQT941CHb_UtKWLHCZHWpSwtiJIu2G` |
| エディタ | https://script.google.com/d/1t0Eb61QGViZ_WFphF9uZ6ApHgG3VSffvW1r_X6qLaWLDTfDL1w4gZ9V-/edit |

## 初回だけ必要な権限許可

1. [Apps Script](https://script.google.com/d/1t0Eb61QGViZ_WFphF9uZ6ApHgG3VSffvW1r_X6qLaWLDTfDL1w4gZ9V-/edit) を開く
2. 関数 `setupWorkbook` を実行して権限許可
3. デプロイ → ウェブアプリ → アクセスを「全員」にする

## clasp

```powershell
cd joyfit-review/gas/toda-closing-survey
clasp push --force
clasp version "note"
clasp deploy -i AKfycbyjyfr1fCvYQjvuFhLbkINwo7KUk8MhNwYALvXjecJ-zM5J1z4TfHJ0YnLHAQcmB-ZS6A -d "closing-survey"
```
