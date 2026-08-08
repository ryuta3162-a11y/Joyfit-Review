/**
 * 催事アンケート専用 GAS（会員アンケートとは別スプレッドシート）
 *
 * スプレッドシート:
 *   https://docs.google.com/spreadsheets/d/1gTYFl6zhHHoUxkEgfaB4k_TFkUF5rmuxIQNu3uOgyis/
 *
 * デプロイ: ウェブアプリ
 * - 実行: 自分
 * - アクセス: 全員
 * URL を Vercel の EVENT_SURVEY_GAS_URL に設定
 *
 * POST body: { action: "eventSurvey", ... }
 * GET ?format=json → 疎通確認用 { ok: true, service: "event-survey" }
 */

function doGet(e) {
  var format = e && e.parameter ? String(e.parameter.format || "").toLowerCase() : "";
  if (format === "json") {
    return outputJson({
      ok: true,
      service: "event-survey",
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
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

function safeSheetName(value) {
  return String(value || "unknown")
    .replace(/[\\\/\?\*\[\]:]/g, "_")
    .trim()
    .slice(0, 40);
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

function getOrCreateEventSurveySheet(eventId, eventName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var base = ("催事_" + safeSheetName(eventId)).slice(0, 90);
  var sheet = ss.getSheetByName(base);
  var headers = [
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

  if (!sheet) {
    sheet = ss.insertSheet(base);
    sheet.appendRow(headers);
    return sheet;
  }

  // 既存シートのヘッダーを最新列構成へ更新（contact → email / address）
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function saveEventSurveyResponse(data) {
  var eventId = String(data.eventId || "").trim() || "event";
  var eventName = String(data.eventName || "").trim() || eventId;
  var rating = Number(data.rating || 0);
  if (!rating) {
    return { ok: false, error: "rating is required" };
  }

  var submissionId = String(data.submissionId || "").trim();
  var sheet = getOrCreateEventSurveySheet(eventId, eventName);

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

    return { ok: true, sheetName: sheet.getName() };
  } finally {
    lock.releaseLock();
  }
}
