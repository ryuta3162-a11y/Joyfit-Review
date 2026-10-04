/**
 * 見学体験 運用ダッシュボード（社内専用）
 * データ: 公開アンケートと同じブックの 戸田_回答 / 経堂_回答
 * URL: ?store=toda（省略時） / ?store=kyodo
 */

var SPREADSHEET_ID = "1jkYhtkXaxqV5-BPpTkeR0HNm6NNXjA8gxC2-0LKKjnY";
var STORES = {
  toda: {
    id: "toda",
    sheet: "戸田_回答",
    name: "FIT365 戸田新曽",
    brandColor: "#e85a86",
    brandDark: "#c4406b"
  },
  kyodo: {
    id: "kyodo",
    sheet: "経堂_回答",
    name: "JOYFIT24経堂",
    brandColor: "#a5354b",
    brandDark: "#862d3d"
  }
};

function resolveStore_(id) {
  var key = String(id || "toda").trim().toLowerCase();
  return STORES[key] || STORES.toda;
}

function doGet(e) {
  try {
    var ss = getWorkbook_();
    Object.keys(STORES).forEach(function (key) {
      var sh = ss.getSheetByName(STORES[key].sheet);
      if (sh) dropHandledColumn_(sh);
    });
  } catch (err) {}
  var store = resolveStore_(e && e.parameter ? e.parameter.store : "toda");
  var tpl = HtmlService.createTemplateFromFile("ops");
  tpl.storeJson = JSON.stringify(store);
  return tpl.evaluate()
    .setTitle(store.name + " 見学体験 運用")
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

function monthKey_(value) {
  if (!value) return "";
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return Utilities.formatDate(d, "Asia/Tokyo", "yyyy-MM");
}

function monthLabel_(value) {
  if (!value) return "";
  var d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return Utilities.formatDate(d, "Asia/Tokyo", "M月");
}

/** 090... の先頭0を、数値化で消されても戻す */
function formatJpPhone_(value) {
  var digits = String(value == null ? "" : value).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.charAt(0) === "0") return digits;
  if (digits.length === 10 || digits.length === 9) return "0" + digits;
  return digits;
}

function isDone_(value) {
  var v = String(value || "").trim();
  return v === "済" || v === "済み" || v === "true" || v === "TRUE" || v === "1";
}

function staffVisit_(value) {
  var v = String(value || "").trim();
  if (v.indexOf("体験") >= 0) return "体験";
  if (v.indexOf("見学") >= 0) return "見学";
  return v;
}

function staffJoin_(value) {
  var v = String(value || "").trim();
  if (!v) return "検討中";
  if (v.indexOf("本日入会") >= 0 || v === "即入") return "即入";
  if (v.indexOf("後日") >= 0) return "後日";
  if (v.indexOf("検討") >= 0) return "検討中";
  if (v.indexOf("入会しない") >= 0) return "入会しない";
  return v;
}

function listOpsRows(storeId) {
  var store = resolveStore_(storeId);
  var ss = getWorkbook_();
  var sheet = ss.getSheetByName(store.sheet);
  if (!sheet) return { ok: false, error: store.sheet + " がありません", store: store };
  dropHandledColumn_(sheet);

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  if (lastRow < 3) {
    return { ok: true, rows: [], stats: emptyStats_() };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var col = {
    timestamp: colIndex_(headers, ["timestamp", "回答日時"]),
    visitType: colIndex_(headers, ["visittype", "見学/体験", "見学体験"]),
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
    joinIntent: colIndex_(headers, ["joinintent", "入会意向", "入会"]),
    sessionMinutes: colIndex_(headers, ["sessionminutes", "利用時間"]),
    memberCode: colIndex_(headers, ["membercode", "会員番号"]),
    feeAdjusted: colIndex_(headers, ["feeadjusted", "個別会費調整済み", "会費調整"]),
    submissionId: colIndex_(headers, ["submissionid", "送信ID"]),
  };

  var values = sheet.getRange(3, 1, lastRow - 2, lastCol).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var visit = staffVisit_(col.visitType >= 0 ? row[col.visitType] : "");
    var joinIntent = staffJoin_(col.joinIntent >= 0 ? row[col.joinIntent] : "");
    rows.push({
      sheetRow: i + 3,
      timestamp: col.timestamp >= 0 ? formatDateTime_(row[col.timestamp]) : "",
      dateLabel: col.timestamp >= 0 ? formatDate_(row[col.timestamp]) : "",
      monthKey: col.timestamp >= 0 ? monthKey_(row[col.timestamp]) : "",
      monthLabel: col.timestamp >= 0 ? monthLabel_(row[col.timestamp]) : "",
      visitType: visit,
      fullName: col.fullName >= 0 ? String(row[col.fullName] || "").trim() : "",
      furigana: col.furigana >= 0 ? String(row[col.furigana] || "").trim() : "",
      phone: col.phone >= 0 ? formatJpPhone_(row[col.phone]) : "",
      email: col.email >= 0 ? String(row[col.email] || "").trim() : "",
      gender: col.gender >= 0 ? String(row[col.gender] || "").trim() : "",
      age: col.age >= 0 ? String(row[col.age] || "").trim() : "",
      university: col.university >= 0 ? String(row[col.university] || "").trim() : "",
      gymExperience: col.gymExperience >= 0 ? String(row[col.gymExperience] || "").trim() : "",
      howFound: col.howFound >= 0 ? String(row[col.howFound] || "").trim() : "",
      rating: col.rating >= 0 ? Number(row[col.rating] || 0) : 0,
      joinIntent: joinIntent,
      sessionMinutes: col.sessionMinutes >= 0 ? String(row[col.sessionMinutes] || "").trim() : "",
      sameDayJoin: joinIntent === "即入",
      memberCode: col.memberCode >= 0 ? String(row[col.memberCode] || "").trim() : "",
      feeAdjusted: col.feeAdjusted >= 0 ? isDone_(row[col.feeAdjusted]) : false,
      submissionId: col.submissionId >= 0 ? String(row[col.submissionId] || "").trim() : "",
    });
  }

  return { ok: true, rows: rows, stats: buildStats_(rows), store: store };
}

function dropHandledColumn_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var en = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var ja = sheet.getLastRow() >= 2 ? sheet.getRange(2, 1, 1, lastCol).getValues()[0] : [];
  var idx = -1;
  for (var i = 0; i < lastCol; i++) {
    var a = String(en[i] || "").trim().toLowerCase();
    var b = String(ja[i] || "").trim();
    if (a === "handled" || b === "対応済み" || b === "対応" || b.indexOf("対応") === 0) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return;
  var filter = sheet.getFilter();
  if (filter) filter.remove();
  sheet.deleteColumn(idx + 1);
  try {
    sheet.getRange(2, idx + 1).setValue("会費調整");
  } catch (err) {}
  try {
    var lastRow = Math.max(sheet.getLastRow(), 3);
    var lastColNow = Math.max(sheet.getLastColumn(), 1);
    sheet.getRange(2, 1, lastRow - 1, lastColNow).createFilter();
  } catch (err2) {}
}

function listTodaOpsRows() {
  return listOpsRows("toda");
}

function emptyStats_() {
  return {
    total: 0,
    kengaku: 0,
    taiken: 0,
    sameDayJoin: 0,
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
    if (row.sameDayJoin && !row.feeAdjusted) stats.feePending += 1;
  }
  return stats;
}

function updateOpsRow(payload) {
  payload = payload || {};
  var store = resolveStore_(payload.store);
  var sheetRow = Number(payload.sheetRow || 0);
  if (sheetRow < 3) return { ok: false, error: "行が不正です" };

  var ss = getWorkbook_();
  var sheet = ss.getSheetByName(store.sheet);
  if (!sheet) return { ok: false, error: store.sheet + " がありません" };

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var memberCol = colIndex_(headers, ["membercode", "会員番号"]) + 1;
  var feeCol = colIndex_(headers, ["feeadjusted", "個別会費調整済み", "会費調整"]) + 1;

  if (payload.memberCode !== undefined && memberCol > 0) {
    var memberCell = sheet.getRange(sheetRow, memberCol);
    memberCell.setNumberFormat("@");
    memberCell.setValue(String(payload.memberCode || "").replace(/\D/g, "").slice(0, 10));
  }
  if (payload.feeAdjusted !== undefined && feeCol > 0) {
    sheet.getRange(sheetRow, feeCol).setValue(payload.feeAdjusted ? "済" : "");
  }

  return { ok: true, sheetRow: sheetRow, store: store.id };
}

function updateTodaOpsRow(payload) {
  payload = payload || {};
  payload.store = payload.store || "toda";
  return updateOpsRow(payload);
}
