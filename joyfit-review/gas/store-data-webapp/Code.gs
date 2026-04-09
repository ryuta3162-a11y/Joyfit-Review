/**
 * 店舗マスタをJSONで返すWebアプリ用スクリプト
 *
 * 手順:
 * 1. このスプレッドシートで「拡張機能」→「Apps Script」
 * 2. この内容を貼り付けて保存
 * 3. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員（または組織内）
 * 4. 発行されたURLを Next.js の STORES_JSON_URL に設定
 *
 * シート名: 店舗データ
 * 列（1行目がヘッダーの場合）:
 *   A 店舗名, B レビューURL, C 店舗ID（任意）, D 検索用テキスト（任意）
 * 1行目がデータの場合も対応（A列が「店舗名」でなければデータ行として読む）
 */
function doGet() {
  const rows = readStoreRows();
  const payload = JSON.stringify(rows);
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}

function readStoreRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("店舗データ");
  if (!sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (!values.length) {
    return [];
  }

  let startIndex = 0;
  const firstA = String(values[0][0] || "").trim();
  if (isHeaderRow(firstA)) {
    startIndex = 1;
  }

  const out = [];
  for (let i = startIndex; i < values.length; i++) {
    const row = values[i];
    const name = String(row[0] || "").trim();
    const googleReviewUrl = String(row[1] || "").trim();
    if (!name || !googleReviewUrl) {
      continue;
    }

    const idCell = String(row[2] || "").trim();
    const id = idCell || "row" + (i + 1);

    const searchCell = String(row[3] || "").trim();
    const searchText = searchCell || defaultSearchText(name, id);

    out.push({
      id: id,
      name: name,
      searchText: searchText,
      googleReviewUrl: googleReviewUrl,
    });
  }

  return out;
}

function isHeaderRow(cellA) {
  if (!cellA) {
    return false;
  }
  return cellA.indexOf("店舗") !== -1 || cellA === "名前" || cellA === "店舗名";
}

function defaultSearchText(name, id) {
  return [name, id].filter(Boolean).join(" ");
}
