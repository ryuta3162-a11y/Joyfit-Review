# EAST ポイント付与管理（社内専用 GAS）

会員向けアンケート（公開GAS・アクセス全員）とは **別プロジェクト** です。
ポイント画面は公開GASから外し、このURLだけが社内向けです。

| 項目 | 値 |
|------|-----|
| Script ID | `1SypJePXqirpjCVF69_i2FhQzmPBJWWsaajG3SAy4TO4-IHxja5dXfYU9` |
| 本番データ（現行 EAST口コミ APP） | https://docs.google.com/spreadsheets/d/13_E8m3vQa_61hcoMAPb7XZTyVDVtQ9O7rkVDNtHQvRM/edit |
| バックアップ用クローン先 | https://docs.google.com/spreadsheets/d/1t4RHRXLoxxxqUZHTvFhqfnUn5jH8G_t2usBbGj_I3vM/edit |
| 公開アンケート GAS | 現行のまま（アクセス＝全員、ポイント画面なし） |
| ポイント管理 URL（社内案内） | https://script.google.com/macros/s/AKfycbwu1eUxJzePa494p-343axfwgUcnHATf-db7FKw806rXZQsHn_ea0uHc6415yw-RZ80/exec |

## アクセス

- 未ログイン → Google ログイン
- 岡本グループ外 → 入れない（DOMAIN）
- 会員サイトの新規回答は、これまでどおり現行 EAST シートに入る

## バックアップ（任意）

Apps Script エディタで `cloneFromEastSurveyWorkbook` を実行すると、現行ブックをクローン先へコピーします。
シート数が多い場合は、完了するまで何度か実行します。
