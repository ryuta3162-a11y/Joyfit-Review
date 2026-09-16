/**
 * FIT365 戸田新曽 見学・体験アンケート（新店クロージング専用）
 *
 * POST { action: "todaClosingSurvey", ... }
 * POST { action: "setupSheet" }
 * GET  ?format=json → 疎通確認
 */

var SHEET_NAME = "見学体験アンケート結果";
var SPREADSHEET_TITLE = "FIT365戸田新曽 見学・体験アンケート結果";

var HEADER_EN = [
  "timestamp",
  "visitType",
  "fullName",
  "furigana",
  "phone",
  "email",
  "gender",
  "age",
  "university",
  "visitedAt",
  "gymExperience",
  "howFound",
  "howFoundOther",
  "nps",
  "npsReason",
  "joinIntent",
  "facilityComment",
  "positives",
  "googleRating",
  "generatedReview",
  "submissionId",
];

var HEADER_JA = [
  "回答日時",
  "見学/体験",
  "お名前",
  "フリガナ",
  "電話番号",
  "メール",
  "性別",
  "年齢",
  "大学名",
  "参加日時",
  "ジム利用経験",
  "知ったきっかけ",
  "きっかけ（その他）",
  "紹介したい度(1-10)",
  "評価の理由",
  "入会意向",
  "施設・スタッフ感想",
  "よかった点",
  "Google星",
  "口コミ文面",
  "送信ID",
];

var COLOR = {
  primary: "#f29bb4",
  primaryDark: "#d97b9d",
  white: "#FFFFFF",
  ink: "#3F3F46",
  zebra: "#FFF7FA",
};

function doGet(e) {
  var format = e && e.parameter ? String(e.parameter.format || "").toLowerCase() : "";
  if (format === "json") {
    var ss = getSpreadsheet();
    return outputJson({
      ok: true,
      service: "toda-closing-survey",
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      sheetName: SHEET_NAME,
    });
  }
  return HtmlService.createHtmlOutput(
    "<p>FIT365 戸田新曽 見学・体験アンケート API</p>",
  ).setTitle("戸田新曽アンケート API");
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return outputJson({ ok: false, error: "empty body" });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || "").trim();
    if (action === "todaClosingSurvey") {
      return outputJson(saveResponse(data));
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
  if (Object.prototype.toString.call(value) === "array") return value;
  if (Object.prototype.toString.call(value) === "[object Array]") return value;
  return [value];
}

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = String(props.getProperty("SPREADSHEET_ID") || "").trim();
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (err) {
      // fall through
    }
  }
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      props.setProperty("SPREADSHEET_ID", active.getId());
      return active;
    }
  } catch (err2) {
    // standalone
  }
  var created = SpreadsheetApp.create(SPREADSHEET_TITLE);
  props.setProperty("SPREADSHEET_ID", created.getId());
  return created;
}

function setupWorkbook() {
  var ss = getSpreadsheet();
  try {
    ss.rename(SPREADSHEET_TITLE);
  } catch (err) {}
  var sheet = getOrCreateSheet(ss);
  styleSheet(sheet);
  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    spreadsheetUrl: ss.getUrl(),
    sheetName: sheet.getName(),
  };
}

function getOrCreateSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  var colCount = HEADER_EN.length;
  var first = String(sheet.getRange(1, 1).getValue() || "");
  if (first === "timestamp") {
    sheet.getRange(1, 1, 1, colCount).setValues([HEADER_EN]);
    sheet.getRange(2, 1, 1, colCount).setValues([HEADER_JA]);
    return;
  }
  sheet.getRange(1, 1, 1, colCount).setValues([HEADER_EN]);
  sheet.getRange(2, 1, 1, colCount).setValues([HEADER_JA]);
}

function styleSheet(sheet) {
  var colCount = HEADER_EN.length;
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var maxStyleRows = Math.max(lastRow, 200);

  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(2);

  var en = sheet.getRange(1, 1, 1, colCount);
  en.setBackground(COLOR.primaryDark).setFontColor(COLOR.white).setFontWeight("bold");
  var ja = sheet.getRange(2, 1, 1, colCount);
  ja.setBackground(COLOR.primary).setFontColor(COLOR.white).setFontWeight("bold").setWrap(true);

  sheet.setRowHeight(1, 28);
  sheet.setRowHeight(2, 36);
  sheet.setTabColor(COLOR.primary);

  var widths = [
    150, 90, 120, 120, 130, 180, 80, 90, 140, 140, 200, 180, 140, 90, 220, 160, 220, 220, 80, 260, 220,
  ];
  for (var c = 0; c < widths.length; c++) {
    sheet.setColumnWidth(c + 1, widths[c]);
  }
}

function getDedupSheet(ss) {
  var sheet = ss.getSheetByName("_toda_dedup");
  if (!sheet) {
    sheet = ss.insertSheet("_toda_dedup");
    sheet.hideSheet();
    sheet.appendRow(["submissionId", "timestamp", "visitType"]);
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

function saveResponse(data) {
  var nps = Number(data.nps || 0);
  if (!nps) return { ok: false, error: "nps is required" };

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
    var visitLabel = visitType === "taiken" ? "無料体験" : "見学";

    sheet.appendRow([
      new Date(),
      visitLabel,
      String(data.fullName || "").trim(),
      String(data.furigana || "").trim(),
      String(data.phone || "").trim(),
      String(data.email || "").trim(),
      String(data.gender || "").trim(),
      String(data.age || "").trim(),
      String(data.university || "").trim(),
      String(data.visitedAt || "").trim(),
      String(data.gymExperience || "").trim(),
      String(data.howFound || "").trim(),
      String(data.howFoundOther || "").trim(),
      nps,
      String(data.npsReason || "").trim(),
      String(data.joinIntent || "").trim(),
      String(data.facilityComment || "").trim(),
      toArray(data.positives).join(" / "),
      Number(data.googleRating || 0),
      String(data.generatedReview || "").trim(),
      submissionId,
    ]);

    if (submissionId) {
      getDedupSheet(ss).appendRow([submissionId, new Date(), visitLabel]);
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
