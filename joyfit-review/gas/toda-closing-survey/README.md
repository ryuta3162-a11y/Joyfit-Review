# FIT365 戸田新曽 見学・体験アンケート GAS

新店クロージング専用。既存の EAST / WEST 口コミ GAS とは別です。

| 項目 | 値 |
|------|------|
| 画面 | `/newstore/toda` |
| Script ID | `1IwDTrWgM7vdqxmlSwTl4djqKFCY_LaevfNhDDZ8QKdEavhIhJPjYkrD4` |
| スプレッドシート | https://docs.google.com/spreadsheets/d/1GIkdbds2Bfv1OF_0THxu_VC3JFuY6mHE-voNSScvpkk/edit |
| ウェブアプリ | https://script.google.com/macros/s/AKfycbw4OAYFaaHqZ49P-HqxlW3gH13WX6Ro7A1vfk0lisiJu7oyjPKzCdxRuam2ilKMgtxQlw/exec |
| エディタ | https://script.google.com/d/1IwDTrWgM7vdqxmlSwTl4djqKFCY_LaevfNhDDZ8QKdEavhIhJPjYkrD4/edit |

## 初回だけ必要な権限許可

1. Apps Script を開く: https://script.google.com/d/1IwDTrWgM7vdqxmlSwTl4djqKFCY_LaevfNhDDZ8QKdEavhIhJPjYkrD4/edit
2. 関数 `setupWorkbook` を選択して **実行**
3. 権限を確認 → 許可

## clasp

```powershell
cd joyfit-review/gas/toda-closing-survey
clasp push --force
clasp version "note"
clasp deploy -i AKfycbw4OAYFaaHqZ49P-HqxlW3gH13WX6Ro7A1vfk0lisiJu7oyjPKzCdxRuam2ilKMgtxQlw -V <version> -d "toda-closing-survey"
```
