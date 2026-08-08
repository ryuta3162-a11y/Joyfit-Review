# 催事アンケート専用 GAS

- スプレッドシート: https://docs.google.com/spreadsheets/d/1gTYFl6zhHHoUxkEgfaB4k_TFkUF5rmuxIQNu3uOgyis/
- Script ID: `1bjcxRPIyQfwYFzGxD2ha4PWrOiQlwF7McVsjqA-zlvEDkXB1QNb6Rhv-`
- Web App URL: `https://script.google.com/macros/s/AKfycby5dFI0fhOWwNHWRWU-Ax-jQAnBANyoPaWix4Kr3s6uL1r6QXregJPAnvYB2H7-AfjOqg/exec`

## 初回だけ必要な権限許可

1. Apps Script を開く: https://script.google.com/d/1bjcxRPIyQfwYFzGxD2ha4PWrOiQlwF7McVsjqA-zlvEDkXB1QNb6Rhv-/edit
2. 関数 `doGet` を選択して **実行**
3. 権限を確認 → 許可
4. ウェブアプリ URL をブラウザで開き、疎通確認  
   `.../exec?format=json`

## clasp

```powershell
cd joyfit-review/gas/event-survey-webapp
clasp push --force
clasp version "note"
clasp deploy -i AKfycby5dFI0fhOWwNHWRWU-Ax-jQAnBANyoPaWix4Kr3s6uL1r6QXregJPAnvYB2H7-AfjOqg -V <version> -d "event-survey-webapp"
```
