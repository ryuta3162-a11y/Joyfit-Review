/**
 * 催事アンケート専用 GAS（会員アンケートとは別スプレッドシート）
 *
 * スプレッドシート:
 *   https://docs.google.com/spreadsheets/d/1gTYFl6zhHHoUxkEgfaB4k_TFkUF5rmuxIQNu3uOgyis/
 *
 * シート名: 催事アンケート結果
 * 1行目: 英語ヘッダー / 2行目: 日本語ヘッダー / 3行目〜: 回答
 *
 * POST { action: "eventSurvey", ... }
 * POST { action: "setupSheet" } → 体裁を整える
 * GET ?format=json → 疎通確認
 */

var EVENT_SHEET_NAME = "催事アンケート結果";
var LEGACY_SHEET_NAME = "催事_pilates-trial-202609";

var HEADER_EN = [
  "timestamp",
  "eventId",
  "eventName",
  "rating",
  "experience",
  "experienceOther",
  "triggers",
  "triggerOther",
  "instagramAccounts",
  "futureEvents",
  "futureEventOther",
  "pilatesMinutes",
  "yogaMinutes",
  "concerns",
  "concernOther",
  "interest",
  "impression",
  "fullName",
  "age",
  "email",
  "address",
  "generatedReview",
  "submissionId",
];

var HEADER_JA = [
  "回答日時",
  "イベントID",
  "イベント名",
  "星評価",
  "体験の感想",
  "体験の感想（その他）",
  "キッカケ",
  "キッカケ（その他）",
  "Instagramアカウント",
  "今後したい体験",
  "今後したい体験（その他）",
  "ピラティス希望時間（分）",
  "ヨガ希望時間（分）",
  "体のお悩み",
  "体のお悩み（その他）",
  "スタジオ体験への興味",
  "本日の感想",
  "お名前",
  "ご年齢",
  "メールアドレス",
  "ご住所",
  "口コミ文面",
  "送信ID",
];

// JOYFIT YOGA ひばりが丘カラー
var COLOR = {
  primary: "#0C9090",
  primaryDark: "#0A7A7A",
  soft: "#E7F6F6",
  softMid: "#D2EFEF",
  white: "#FFFFFF",
  ink: "#134E4A",
  zebra: "#F7FBFB",
  border: "#9AD5D5",
};

function doGet(e) {
  var format = e && e.parameter ? String(e.parameter.format || "").toLowerCase() : "";
  var action = e && e.parameter ? String(e.parameter.action || "").trim() : "";
  if (format === "json" && action === "setupSheet") {
    return outputJson(setupEventSurveyWorkbook());
  }
  if (format === "json") {
    return outputJson({
      ok: true,
      service: "event-survey",
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
      sheetName: EVENT_SHEET_NAME,
    });
  }
  return HtmlService.createHtmlOutput(
    "<p>JOYFIT 催事アンケート API</p><p>POST action=eventSurvey で回答を保存します。</p>",
  ).setTitle("催事アンケート API");
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return outputJson({ ok: false, error: "empty body" });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || "").trim();

    if (action === "eventSurvey") {
      return outputJson(saveEventSurveyResponse(data));
    }
    if (action === "setupSheet") {
      return outputJson(setupEventSurveyWorkbook());
    }

    return outputJson({ ok: false, error: "unknown action" });
  } catch (err) {
    return outputJson({ ok: false, error: String(err) });
  }
}

function outputJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function toArray(value) {
  if (!value) return [];
  if (Object.prototype.toString.call(value) === "[object Array]") return value;
  return [value];
}

function getEventDedupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("_event_survey_dedup");
  if (!sheet) {
    sheet = ss.insertSheet("_event_survey_dedup");
    sheet.hideSheet();
    sheet.appendRow(["submissionId", "timestamp", "eventId"]);
  }
  return sheet;
}

function isEventSubmissionIdRecorded(submissionId) {
  if (!submissionId) return false;
  var sheet = getEventDedupSheet();
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

function recordEventSubmissionId(submissionId, eventId) {
  if (!submissionId) return;
  getEventDedupSheet().appendRow([submissionId, new Date(), eventId]);
}

/** エディタから手動実行してもOK */
function setupEventSurveyWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    ss.rename("JOYFIT YOGA 催事アンケート結果");
  } catch (err) {
    // 権限や競合時は無視
  }

  var sheet = getOrCreateEventSurveySheet();
  styleEventSurveySheet(sheet);

  // 旧シートが残っていれば非表示（データは新シートへ移行済み想定）
  var legacy = ss.getSheetByName(LEGACY_SHEET_NAME);
  if (legacy && legacy.getSheetId() !== sheet.getSheetId()) {
    try {
      legacy.hideSheet();
    } catch (e2) {}
  }

  return {
    ok: true,
    spreadsheetName: ss.getName(),
    sheetName: sheet.getName(),
    headers: HEADER_EN.length,
  };
}

function getOrCreateEventSurveySheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EVENT_SHEET_NAME);

  // 旧シート名からの移行
  if (!sheet) {
    var legacy = ss.getSheetByName(LEGACY_SHEET_NAME);
    if (legacy) {
      legacy.setName(EVENT_SHEET_NAME);
      sheet = legacy;
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(EVENT_SHEET_NAME);
  }

  ensureDualHeaders(sheet);
  return sheet;
}

function ensureDualHeaders(sheet) {
  var colCount = HEADER_EN.length;
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var firstCell = String(sheet.getRange(1, 1).getValue() || "");

  // すでに英日2段ヘッダーなら中身だけ最新化
  if (firstCell === "timestamp" && String(sheet.getRange(2, 1).getValue() || "") === "回答日時") {
    sheet.getRange(1, 1, 1, colCount).setValues([HEADER_EN]);
    sheet.getRange(2, 1, 1, colCount).setValues([HEADER_JA]);
    return;
  }

  // 旧: 1行目だけ英語ヘッダー → 日本語行を挿入
  if (firstCell === "timestamp") {
    var dataRows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
    sheet.clear();
    sheet.getRange(1, 1, 1, colCount).setValues([HEADER_EN]);
    sheet.getRange(2, 1, 1, colCount).setValues([HEADER_JA]);
    if (dataRows.length) {
      // 列数を揃えて書き戻し
      var normalized = dataRows.map(function (row) {
        var next = [];
        for (var i = 0; i < colCount; i++) {
          next.push(i < row.length ? row[i] : "");
        }
        return next;
      });
      sheet.getRange(3, 1, normalized.length, colCount).setValues(normalized);
    }
    return;
  }

  // 新規
  sheet.clear();
  sheet.getRange(1, 1, 1, colCount).setValues([HEADER_EN]);
  sheet.getRange(2, 1, 1, colCount).setValues([HEADER_JA]);
}

function styleEventSurveySheet(sheet) {
  var colCount = HEADER_EN.length;
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var maxStyleRows = Math.max(lastRow, 200);

  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(2);
  sheet.getRange(1, 1, maxStyleRows, colCount).setFontFamily("Meiryo");

  // 1行目: 英語（濃いティール）
  var en = sheet.getRange(1, 1, 1, colCount);
  en.setBackground(COLOR.primaryDark);
  en.setFontColor(COLOR.white);
  en.setFontWeight("bold");
  en.setFontSize(10);
  en.setHorizontalAlignment("center");
  en.setVerticalAlignment("middle");

  // 2行目: 日本語（明るいティール）
  var ja = sheet.getRange(2, 1, 1, colCount);
  ja.setBackground(COLOR.primary);
  ja.setFontColor(COLOR.white);
  ja.setFontWeight("bold");
  ja.setFontSize(11);
  ja.setHorizontalAlignment("center");
  ja.setVerticalAlignment("middle");
  ja.setWrap(true);

  sheet.setRowHeight(1, 28);
  sheet.setRowHeight(2, 36);

  // データ帯
  var data = sheet.getRange(3, 1, maxStyleRows, colCount);
  data.setBackground(COLOR.white);
  data.setFontColor(COLOR.ink);
  data.setFontSize(10);
  data.setVerticalAlignment("middle");
  data.setWrap(true);

  // ゼブラ
  for (var r = 3; r <= maxStyleRows; r++) {
    if (r % 2 === 1) {
      sheet.getRange(r, 1, r, colCount).setBackground(COLOR.zebra);
    }
  }

  // 評価列を目立たせる
  var ratingCol = 4;
  var ratingRange = sheet.getRange(3, ratingCol, maxStyleRows, ratingCol);
  ratingRange.setHorizontalAlignment("center");
  ratingRange.setFontWeight("bold");
  ratingRange.setFontColor(COLOR.primaryDark);

  // 列幅
  var widths = [
    150, 140, 220, 70, 220, 160, 180, 140, 160, 180, 140, 110, 110, 180, 140, 200, 220, 120, 70, 200, 180, 240, 220,
  ];
  for (var c = 0; c < widths.length; c++) {
    sheet.setColumnWidth(c + 1, widths[c]);
  }

  // フィルタ
  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }
  sheet.getRange(2, 1, Math.max(sheet.getLastRow(), 2), colCount).createFilter();

  // シートタブ色
  sheet.setTabColor(COLOR.primary);
}

function saveEventSurveyResponse(data) {
  var eventId = String(data.eventId || "").trim() || "event";
  var eventName = String(data.eventName || "").trim() || eventId;
  var rating = Number(data.rating || 0);
  if (!rating) {
    return { ok: false, error: "rating is required" };
  }

  var submissionId = String(data.submissionId || "").trim();
  var sheet = getOrCreateEventSurveySheet();
  styleEventSurveySheet(sheet);

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { ok: false, error: "server busy" };
  }

  try {
    if (submissionId && isEventSubmissionIdRecorded(submissionId)) {
      return { ok: true, duplicate: true, sheetName: sheet.getName() };
    }

    var email = String(data.email || data.contact || "").trim();
    var address = String(data.address || "").trim();

    // 2行ヘッダーの下へ追記
    sheet.appendRow([
      new Date(),
      eventId,
      eventName,
      rating,
      toArray(data.experience).join(" / "),
      String(data.experienceOther || "").trim(),
      toArray(data.triggers).join(" / "),
      String(data.triggerOther || "").trim(),
      toArray(data.instagramAccounts).join(" / "),
      toArray(data.futureEvents).join(" / "),
      String(data.futureEventOther || "").trim(),
      String(data.pilatesMinutes || "").trim(),
      String(data.yogaMinutes || "").trim(),
      toArray(data.concerns).join(" / "),
      String(data.concernOther || "").trim(),
      String(data.interest || "").trim(),
      String(data.impression || "").trim(),
      String(data.fullName || "").trim(),
      String(data.age || "").trim(),
      email,
      address,
      String(data.generatedReview || "").trim(),
      submissionId,
    ]);

    if (submissionId) {
      recordEventSubmissionId(submissionId, eventId);
    }

    // 追記行にも軽いスタイル
    var row = sheet.getLastRow();
    sheet.getRange(row, 1, 1, HEADER_EN.length).setFontFamily("Meiryo").setFontSize(10).setFontColor(COLOR.ink);
    if (row % 2 === 1) {
      sheet.getRange(row, 1, 1, HEADER_EN.length).setBackground(COLOR.zebra);
    } else {
      sheet.getRange(row, 1, 1, HEADER_EN.length).setBackground(COLOR.white);
    }
    sheet.getRange(row, 4).setFontWeight("bold").setFontColor(COLOR.primaryDark).setHorizontalAlignment("center");

    return { ok: true, sheetName: sheet.getName() };
  } finally {
    lock.releaseLock();
  }
}
