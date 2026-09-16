/**
 * 見学体験後アンケート（JOYFIT24経堂 / FIT365戸田新曽）
 * スプレッドシート（2店舗共通）:
 *   https://docs.google.com/spreadsheets/d/1jkYhtkXaxqV5-BPpTkeR0HNm6NNXjA8gxC2-0LKKjnY/edit
 *
 * POST { action: "survey" | "todaClosingSurvey", ... }
 * GET  ?format=json
 * GET  ?action=ping
 */

var SPREADSHEET_ID = "1jkYhtkXaxqV5-BPpTkeR0HNm6NNXjA8gxC2-0LKKjnY";
var SHEET_NAME = "回答";

var HEADER_EN = [
  "timestamp",
  "storeId",
  "storeName",
  "visitType",
  "fullName",
  "furigana",
  "phone",
  "email",
  "gender",
  "age",
  "university",
  "gymExperience",
  "howFound",
  "howFoundOther",
  "rating",
  "joinIntent",
  "extraComment",
  "positives",
  "generatedReview",
  "submissionId",
];

var HEADER_JA = [
  "回答日時",
  "店舗ID",
  "店舗名",
  "見学/体験",
  "お名前",
  "フリガナ",
  "電話番号",
  "メール",
  "性別",
  "年齢",
  "大学名",
  "ジム利用経験",
  "知ったきっかけ",
  "きっかけ（その他）",
  "星評価",
  "入会意向",
  "追加ご意見",
  "よかった点",
  "口コミ文面",
  "送信ID",
];

var COLOR = {
  primary: "#a5354b",
  primaryDark: "#862d3d",
  white: "#FFFFFF",
  ink: "#3F3F46",
};

function doGet(e) {
  var format = e && e.parameter ? String(e.parameter.format || "").toLowerCase() : "";
  var action = e && e.parameter ? String(e.parameter.action || "").trim() : "";
  if (action === "ping" || format === "json") {
    var ss = getSpreadsheet();
    return outputJson({
      ok: true,
      service: "closing-survey",
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      sheetName: SHEET_NAME,
    });
  }
  return HtmlService.createHtmlOutput(
    "<p>見学体験後アンケート API（経堂 / 戸田新曽）</p>",
  ).setTitle("見学体験後アンケート");
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return outputJson({ ok: false, error: "empty body" });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || "").trim();
    if (action === "survey" || action === "todaClosingSurvey") {
      return outputJson(saveSurveyResponse(data));
    }
    if (action === "setupSheet") {
      return outputJson(setupWorkbook());
    }
    return outputJson({ ok: false, error: "unknown action" });
  } catch (err) {
    return outputJson({ ok: false, error: String(err) });
  }
}

function outputJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function toArray(value) {
  if (!value) return [];
  if (Object.prototype.toString.call(value) === "[object Array]") return value;
  return [value];
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function setupWorkbook() {
  var ss = getSpreadsheet();
  try {
    ss.rename("見学体験後アンケート（経堂・戸田新曽）");
  } catch (err) {}
  var sheet = getOrCreateSheet(ss);
  styleSheet(sheet);
  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheetName: sheet.getName(),
  };
}

function getOrCreateSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    var first = ss.getSheets()[0];
    if (first && first.getLastRow() <= 1) {
      try {
        first.setName(SHEET_NAME);
        sheet = first;
      } catch (err) {}
    }
  }
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  var colCount = HEADER_EN.length;
  sheet.getRange(1, 1, 1, colCount).setValues([HEADER_EN]);
  sheet.getRange(2, 1, 1, colCount).setValues([HEADER_JA]);
}

function styleSheet(sheet) {
  var colCount = HEADER_EN.length;
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(2);
  sheet.getRange(1, 1, 1, colCount)
    .setBackground(COLOR.primaryDark)
    .setFontColor(COLOR.white)
    .setFontWeight("bold");
  sheet.getRange(2, 1, 1, colCount)
    .setBackground(COLOR.primary)
    .setFontColor(COLOR.white)
    .setFontWeight("bold")
    .setWrap(true);
  sheet.setRowHeight(1, 28);
  sheet.setRowHeight(2, 36);
  sheet.setTabColor(COLOR.primary);
  var widths = [150, 90, 140, 90, 120, 120, 130, 180, 80, 90, 140, 180, 180, 140, 70, 160, 200, 220, 260, 220];
  for (var c = 0; c < widths.length; c++) {
    sheet.setColumnWidth(c + 1, widths[c]);
  }
}

function getDedupSheet(ss) {
  var sheet = ss.getSheetByName("_closing_dedup");
  if (!sheet) {
    sheet = ss.insertSheet("_closing_dedup");
    sheet.hideSheet();
    sheet.appendRow(["submissionId", "timestamp", "storeId"]);
  }
  return sheet;
}

function isDuplicate(ss, submissionId) {
  if (!submissionId) return false;
  var sheet = getDedupSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  return (
    sheet
      .getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(submissionId)
      .matchEntireCell(true)
      .findNext() !== null
  );
}

function saveSurveyResponse(data) {
  var rating = Number(data.rating || data.googleRating || data.nps || 0);
  if (!rating) return { ok: false, error: "rating is required" };

  var storeId = String(data.storeId || "").trim();
  var storeName = String(data.storeName || "").trim();
  if (!storeId || !storeName) {
    return { ok: false, error: "store is required" };
  }

  var submissionId = String(data.submissionId || "").trim();
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss);
  styleSheet(sheet);

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { ok: false, error: "server busy" };
  }

  try {
    if (submissionId && isDuplicate(ss, submissionId)) {
      return { ok: true, duplicate: true, sheetName: sheet.getName() };
    }

    var visitType = String(data.visitType || "").trim();
    var visitLabel = visitType === "taiken" ? "無料体験" : visitType === "kengaku" ? "見学" : visitType;

    sheet.appendRow([
      new Date(),
      storeId,
      storeName,
      visitLabel,
      String(data.fullName || "").trim(),
      String(data.furigana || "").trim(),
      String(data.phone || "").trim(),
      String(data.email || "").trim(),
      String(data.gender || "").trim(),
      String(data.age || data.ageRange || "").trim(),
      String(data.university || "").trim(),
      String(data.gymExperience || "").trim(),
      String(data.howFound || "").trim(),
      String(data.howFoundOther || "").trim(),
      rating,
      String(data.joinIntent || "").trim(),
      String(data.extraComment || data.freeComment || "").trim(),
      toArray(data.positives).join(" / "),
      String(data.generatedReview || "").trim(),
      submissionId,
    ]);

    if (submissionId) {
      getDedupSheet(ss).appendRow([submissionId, new Date(), storeId]);
    }

    return {
      ok: true,
      sheetName: sheet.getName(),
      spreadsheetUrl: ss.getUrl(),
    };
  } finally {
    lock.releaseLock();
  }
}
