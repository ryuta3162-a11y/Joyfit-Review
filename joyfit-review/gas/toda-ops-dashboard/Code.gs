/**
 * FIT365 戸田新曽 見学体験 運用ダッシュボード（社内専用）
 * データ: 公開アンケートと同じブックの 戸田_回答
 *
 * デプロイ: ウェブアプリ
 * - 実行: 自分
 * - アクセス: 岡本グループ内（DOMAIN）
 */

var SPREADSHEET_ID = "1jkYhtkXaxqV5-BPpTkeR0HNm6NNXjA8gxC2-0LKKjnY";
var TODA_SHEET = "戸田_回答";

function doGet() {
  return HtmlService.createTemplateFromFile("ops")
    .evaluate()
    .setTitle("戸田 見学体験 運用")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getWorkbook_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function colIndex_(headers, names) {
  var wanted = names.map(function (n) {
    return String(n || "").trim().toLowerCase();
  });
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || "").trim().toLowerCase();
    if (wanted.indexOf(key) >= 0) return i;
  }
  return -1;
}

function formatDate_(value) {
  if (!value) return "";
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return Utilities.formatDate(d, "Asia/Tokyo", "M月d日");
}

function formatDateTime_(value) {
  if (!value) return "";
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return Utilities.formatDate(d, "Asia/Tokyo", "yyyy/MM/dd HH:mm");
}

function isDone_(value) {
  var v = String(value || "").trim();
  return v === "済" || v === "済み" || v === "true" || v === "TRUE" || v === "1";
}

function listTodaOpsRows() {
  var ss = getWorkbook_();
  var sheet = ss.getSheetByName(TODA_SHEET);
  if (!sheet) return { ok: false, error: "戸田_回答 がありません" };

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  if (lastRow < 3) {
    return { ok: true, rows: [], stats: emptyStats_() };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var col = {
    timestamp: colIndex_(headers, ["timestamp", "回答日時"]),
    visitType: colIndex_(headers, ["visittype", "見学/体験"]),
    fullName: colIndex_(headers, ["fullname", "お名前"]),
    furigana: colIndex_(headers, ["furigana", "フリガナ"]),
    phone: colIndex_(headers, ["phone", "電話番号"]),
    email: colIndex_(headers, ["email", "メール"]),
    gender: colIndex_(headers, ["gender", "性別"]),
    age: colIndex_(headers, ["age", "年齢"]),
    university: colIndex_(headers, ["university", "大学名"]),
    gymExperience: colIndex_(headers, ["gymexperience", "ジム利用経験"]),
    howFound: colIndex_(headers, ["howfound", "知ったきっかけ"]),
    rating: colIndex_(headers, ["rating", "星評価"]),
    joinIntent: colIndex_(headers, ["joinintent", "入会意向"]),
    memberCode: colIndex_(headers, ["membercode", "会員番号"]),
    handled: colIndex_(headers, ["handled", "対応済み"]),
    feeAdjusted: colIndex_(headers, ["feeadjusted", "個別会費調整済み"]),
    submissionId: colIndex_(headers, ["submissionid", "送信ID"]),
  };

  var values = sheet.getRange(3, 1, lastRow - 2, lastCol).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var visit = col.visitType >= 0 ? String(row[col.visitType] || "").trim() : "";
    var joinIntent = col.joinIntent >= 0 ? String(row[col.joinIntent] || "").trim() : "";
    rows.push({
      sheetRow: i + 3,
      timestamp: col.timestamp >= 0 ? formatDateTime_(row[col.timestamp]) : "",
      dateLabel: col.timestamp >= 0 ? formatDate_(row[col.timestamp]) : "",
      visitType: visit,
      fullName: col.fullName >= 0 ? String(row[col.fullName] || "").trim() : "",
      furigana: col.furigana >= 0 ? String(row[col.furigana] || "").trim() : "",
      phone: col.phone >= 0 ? String(row[col.phone] || "").trim() : "",
      email: col.email >= 0 ? String(row[col.email] || "").trim() : "",
      gender: col.gender >= 0 ? String(row[col.gender] || "").trim() : "",
      age: col.age >= 0 ? String(row[col.age] || "").trim() : "",
      university: col.university >= 0 ? String(row[col.university] || "").trim() : "",
      gymExperience: col.gymExperience >= 0 ? String(row[col.gymExperience] || "").trim() : "",
      howFound: col.howFound >= 0 ? String(row[col.howFound] || "").trim() : "",
      rating: col.rating >= 0 ? Number(row[col.rating] || 0) : 0,
      joinIntent: joinIntent,
      sameDayJoin: joinIntent.indexOf("本日入会") >= 0,
      memberCode: col.memberCode >= 0 ? String(row[col.memberCode] || "").trim() : "",
      handled: col.handled >= 0 ? isDone_(row[col.handled]) : false,
      feeAdjusted: col.feeAdjusted >= 0 ? isDone_(row[col.feeAdjusted]) : false,
      submissionId: col.submissionId >= 0 ? String(row[col.submissionId] || "").trim() : "",
    });
  }

  rows.sort(function (a, b) {
    return String(b.timestamp).localeCompare(String(a.timestamp));
  });

  return { ok: true, rows: rows, stats: buildStats_(rows) };
}

function emptyStats_() {
  return {
    total: 0,
    kengaku: 0,
    taiken: 0,
    sameDayJoin: 0,
    unhandled: 0,
    feePending: 0,
  };
}

function buildStats_(rows) {
  var stats = emptyStats_();
  stats.total = rows.length;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row.visitType.indexOf("見学") >= 0) stats.kengaku += 1;
    if (row.visitType.indexOf("体験") >= 0) stats.taiken += 1;
    if (row.sameDayJoin) stats.sameDayJoin += 1;
    if (!row.handled) stats.unhandled += 1;
    if (row.sameDayJoin && !row.feeAdjusted) stats.feePending += 1;
  }
  return stats;
}

function updateTodaOpsRow(payload) {
  payload = payload || {};
  var sheetRow = Number(payload.sheetRow || 0);
  if (sheetRow < 3) return { ok: false, error: "行が不正です" };

  var ss = getWorkbook_();
  var sheet = ss.getSheetByName(TODA_SHEET);
  if (!sheet) return { ok: false, error: "戸田_回答 がありません" };

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var memberCol = colIndex_(headers, ["membercode", "会員番号"]) + 1;
  var handledCol = colIndex_(headers, ["handled", "対応済み"]) + 1;
  var feeCol = colIndex_(headers, ["feeadjusted", "個別会費調整済み"]) + 1;

  if (payload.memberCode !== undefined && memberCol > 0) {
    sheet.getRange(sheetRow, memberCol).setValue(String(payload.memberCode || "").trim());
  }
  if (payload.handled !== undefined && handledCol > 0) {
    sheet.getRange(sheetRow, handledCol).setValue(payload.handled ? "済" : "");
  }
  if (payload.feeAdjusted !== undefined && feeCol > 0) {
    sheet.getRange(sheetRow, feeCol).setValue(payload.feeAdjusted ? "済" : "");
  }

  return listTodaOpsRows();
}
