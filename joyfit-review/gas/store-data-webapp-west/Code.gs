/**
 * WEST（関西・西日本）口コミ APP
 * 店舗マスタJSON（GET）＋ 低評価フィードバックメール送信（POST）
 *
 * スプレッドシート: WEST口コミ　APP
 * 初期セットアップ: エディタで setupWestWorkbook() を1回実行
 *   または GET ?format=json&action=setupWorkbook
 *
 * デプロイ: ウェブアプリ
 * - 実行: 自分
 * - アクセス: 全員（または組織内）
 * URL を Next.js の STORES_JSON_URL（WEST用）に設定（GET/POST 共通）
 *
 * ポイント付与管理画面: 同じウェブアプリ URL に ?page=points を付けて開く
 *   例: https://script.google.com/.../exec?page=points
 *   V列 = ポイント付与済チェック（回答シート A〜P 列はそのまま）
 *
 * シート名: 店舗データ
 *
 * 【推奨レイアウト】1行目ヘッダー例:
 *   A 店舗名 | B レビューURL | C 低評価通知メール | D 店舗ID | E 住所 | F 緯度 | G 経度 | H 検索用 | I 特典文言（任意）
 *
 * 【互換】C列にメールが無い旧データ:
 *   A 店舗名 | B URL | C 店舗ID | D 検索用
 *   （Cに@が含まれない場合は C=店舗ID として扱います）
 *
 * 【重要】MailApp 初回エラー「script.send_mail の権限がない」が出るとき:
 *   1. 左「プロジェクトの設定」→「appsscript.json をエディタで表示」をオンにし、
 *      リポジトリの appsscript.json と同じ oauthScopes を貼る（またはマージ）
 *   2. 下の authorizeMailOnce をエディタで「実行」→ 権限を確認して許可
 *   3. ウェブアプリを「新しいバージョン」で再デプロイ
 */

var WEST_REGION_LABEL = "WEST（関西・西日本）";
var STORE_HEADERS = [
  "店舗名",
  "レビューURL",
  "低評価通知メール",
  "店舗ID",
  "住所",
  "緯度",
  "経度",
  "検索用",
  "特典文言",
];
var WEST_COLOR = {
  primary: "#a5354b",
  primaryDark: "#862d3d",
  primarySoft: "#bf4e64",
  zebra: "#faf6f7",
  white: "#ffffff",
  ink: "#18181b",
  muted: "#71717a",
  guideBg: "#fff7f8",
};

/**
 * 初回だけエディタから実行してください（自分宛にテストメール）。
 * 権限ダイアログで「メール送信」を許可すると doPost でも送れるようになります。
 */
function authorizeMailOnce() {
  var me = Session.getActiveUser().getEmail();
  if (!me) {
    throw new Error("メールアドレスを取得できません。ログインし直してください。");
  }
  MailApp.sendEmail(me, "【JOYFIT GAS】送信テスト", "このメールが届けば MailApp の権限はOKです。");
}

function doGet(e) {
  var format = e && e.parameter ? String(e.parameter.format || "").toLowerCase() : "";
  var action = e && e.parameter ? String(e.parameter.action || "").trim() : "";
  if (format === "json" && action === "checkRespondent") {
    return outputJson(
      checkSurveyRespondent({
        memberCode: e.parameter.memberCode,
      }),
    );
  }
  if (format === "json" && action === "setupWorkbook") {
    return outputJson(setupWestWorkbook());
  }
  if (format === "json" && action === "seedSampleStores") {
    return outputJson(seedWestSampleStores());
  }
  if (format === "json") {
    var rows = readStoreRows();
    return outputJson(rows);
  }

  var page = e && e.parameter ? String(e.parameter.page || "").trim().toLowerCase() : "";

  // 会員向け GAS 版（index.html がある場合のみ）。本番は Vercel を使用。
  if (page === "survey" || page === "member") {
    return renderMemberSurveyPage();
  }

  // ポイント付与管理（?page=points または URL 直下）
  return renderPointsAdminPage();
}

function renderPointsAdminPage() {
  var pointsTemplate = HtmlService.createTemplateFromFile("points");
  pointsTemplate.stores = readStoreRows();
  return pointsTemplate
    .evaluate()
    .setTitle("ポイント付与管理 | JOYFIT")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function renderMemberSurveyPage() {
  var template = HtmlService.createTemplateFromFile("index");
  template.stores = readStoreRows();
  return template
    .evaluate()
    .setTitle("JOYFIT 口コミサポート")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return outputJson({ ok: false, error: "empty body" });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || "").trim();

    if (action === "setupWorkbook") {
      return outputJson(setupWestWorkbook());
    }

    if (action === "seedSampleStores") {
      return outputJson(seedWestSampleStores());
    }

    if (action === "checkRespondent") {
      return outputJson(checkSurveyRespondent(data));
    }

    if (action === "survey") {
      var result = saveSurveyResponse(data);
      if (!result.ok) {
        return outputJson(result);
      }
      if (result.shouldNotify) {
        sendLowRatingMail(data, result.to);
      }
      return outputJson({ ok: true, savedSheet: result.sheetName, duplicate: !!result.duplicate });
    }

    if (action === "eventSurvey") {
      return outputJson(saveEventSurveyResponse(data));
    }

    // 旧互換: メール送信だけのPOST
    var to = String(data.to || "").trim();
    if (!to || to.indexOf("@") < 0) {
      return outputJson({ ok: false, error: "invalid recipient" });
    }
    var subject = String(data.subject || "【JOYFIT】低評価フィードバック");
    var body = String(data.body || "");
    MailApp.sendEmail(to, subject, body);
    return outputJson({ ok: true });
  } catch (err) {
    return outputJson({ ok: false, error: String(err) });
  }
}

function getStoresForWeb() {
  return readStoreRows();
}

function submitSurveyFromWeb(data) {
  var payload = data || {};
  payload.action = "survey";

  var to = String(payload.feedbackEmail || "").trim();
  payload.to = to;

  var result = saveSurveyResponse(payload);
  if (!result.ok) {
    return result;
  }
  if (result.shouldNotify) {
    sendLowRatingMail(payload, result.to);
  }
  return { ok: true, savedSheet: result.sheetName };
}

function outputJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readStoreRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("店舗データ");
  if (!sheet) {
    return [];
  }

  var values = sheet.getDataRange().getValues();
  if (!values.length) {
    return [];
  }

  var startIndex = 0;
  var firstA = String(values[0][0] || "").trim();
  if (isHeaderRow(firstA)) {
    startIndex = 1;
  }

  var out = [];
  for (var i = startIndex; i < values.length; i++) {
    var row = values[i];
    var name = String(row[0] || "").trim();
    var googleReviewUrl = String(row[1] || "").trim();
    if (!name || !googleReviewUrl) {
      continue;
    }

    var c = String(row[2] || "").trim();
    var d = String(row[3] || "").trim();
    var e = String(row[4] || "").trim();
    var f = String(row[5] || "").trim();
    var g = String(row[6] || "").trim();
    var h = String(row[7] || "").trim();
    var rewardLabel = String(row[8] || "").trim();

    var feedbackEmail = "";
    var id = "";
    var searchText = "";
    var address = "";
    var latitude = null;
    var longitude = null;

    if (c.indexOf("@") >= 0 || !c) {
      // 新レイアウト: C=通知メール（空欄可） / D=店舗ID / E以降=住所・座標
      feedbackEmail = c.indexOf("@") >= 0 ? c : "";
      id = d || "row" + (i + 1);
      address = e;
      latitude = parseCoordinate(f);
      longitude = parseCoordinate(g);
      searchText = h || defaultSearchText(name, id, address);
    } else {
      id = c || "row" + (i + 1);
      searchText = d || defaultSearchText(name, id, "");
    }

    out.push({
      id: id,
      name: name,
      searchText: searchText,
      googleReviewUrl: googleReviewUrl,
      feedbackEmail: feedbackEmail,
      address: address,
      latitude: latitude,
      longitude: longitude,
      rewardLabel: rewardLabel,
    });
  }

  return out;
}

function isHeaderRow(cellA) {
  if (!cellA) {
    return false;
  }
  return (
    cellA.indexOf("店舗") !== -1 ||
    cellA === "名前" ||
    cellA === "店舗名"
  );
}

function defaultSearchText(name, id, address) {
  return [name, id, address].filter(Boolean).join(" ");
}

function parseCoordinate(raw) {
  var n = Number(raw);
  if (!isFinite(n)) return null;
  return n;
}

/** 回答シートの会員番号列（1始まり・標準レイアウトではF列=6） */
var SURVEY_MEMBER_CODE_COL = 6;

function normalizeMemberCode(value) {
  var mc = String(value || "").trim().replace(/\D/g, "");
  if (!/^\d{10}$/.test(mc) || /^0{10}$/.test(mc)) {
    return "";
  }
  return mc;
}

function checkSurveyRespondent(data) {
  var memberCodeNorm = normalizeMemberCode(data.memberCode);
  if (!memberCodeNorm) {
    return { ok: true, eligible: true };
  }
  ensureMemberCodeIndex();
  if (isMemberCodeRecorded(memberCodeNorm)) {
    return { ok: true, eligible: false, matchedBy: "memberCode" };
  }
  return { ok: true, eligible: true };
}

function saveSurveyResponse(data) {
  var storeId = String(data.storeId || "").trim() || "unknown";
  var storeName = String(data.storeName || "").trim() || "unknown";
  var rating = Number(data.rating || 0);
  if (!rating) {
    return { ok: false, error: "rating is required" };
  }
  var memberCode = String(data.memberCode || "").trim();
  if (!/^\d{10}$/.test(memberCode)) {
    return { ok: false, error: "memberCode must be 10-digit number" };
  }
  if (/^0{10}$/.test(memberCode)) {
    return { ok: false, error: "memberCode must not be placeholder" };
  }

  var to = String(data.to || "").trim();
  var submissionId = String(data.submissionId || "").trim();
  var sheet = getOrCreateSurveySheet(storeId, storeName);
  var skipAutoMail = String(data.skipAutoMail || "").toLowerCase() === "true" || data.skipAutoMail === true;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { ok: false, error: "server busy" };
  }

  var email = String(data.email || "").trim();
  var respondentFullName = String(data.fullName || "").trim();

  try {
    if (submissionId && isSubmissionIdRecorded(submissionId)) {
      return {
        ok: true,
        duplicate: true,
        to: to,
        shouldNotify: false,
        sheetName: sheet.getName(),
      };
    }

    ensureMemberCodeIndex();
    if (isMemberCodeRecorded(memberCode)) {
      return { ok: false, error: "already_answered", matchedBy: "memberCode" };
    }

    sheet.appendRow([
      new Date(),
      storeId,
      storeName,
      rating,
      respondentFullName,
      memberCode,
      String(data.gender || "").trim(),
      String(data.ageRange || "").trim(),
      email,
      String(data.visitDate || "").trim(),
      to,
      toArray(data.positives).join(" / "),
      toArray(data.useScenes).join(" / "),
      String(data.freeComment || "").trim(),
      String(data.generatedReview || "").trim(),
      submissionId,
    ]);

    if (submissionId) {
      recordSurveySubmissionId(submissionId, storeId, memberCode);
    }
    recordMemberCode(memberCode);

    return {
      ok: true,
      to: to,
      shouldNotify: rating <= 3 && to.indexOf("@") >= 0 && !skipAutoMail,
      sheetName: sheet.getName(),
    };
  } finally {
    lock.releaseLock();
  }
}

/** 催事アンケート（会員番号不要・既存会員アンケートの重複制約と分離） */
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
    if (submissionId && isSubmissionIdRecorded(submissionId)) {
      return { ok: true, duplicate: true, sheetName: sheet.getName() };
    }

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
      String(data.contact || "").trim(),
      String(data.generatedReview || "").trim(),
      submissionId,
    ]);

    if (submissionId) {
      recordSurveySubmissionId(submissionId, eventId, "event");
    }

    return { ok: true, sheetName: sheet.getName() };
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateEventSurveySheet(eventId, eventName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var base = ("催事_" + safeSheetName(eventId)).slice(0, 90);
  var sheet = ss.getSheetByName(base);
  if (sheet) return sheet;

  sheet = ss.insertSheet(base);
  sheet.appendRow([
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
    "contact",
    "generatedReview",
    "submissionId",
  ]);
  return sheet;
}

function getSurveyDedupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("_survey_dedup");
  if (!sheet) {
    sheet = ss.insertSheet("_survey_dedup");
    sheet.hideSheet();
    sheet.appendRow(["submissionId", "timestamp", "storeId", "memberCode"]);
  }
  return sheet;
}

function isSubmissionIdRecorded(submissionId) {
  if (!submissionId) {
    return false;
  }
  var sheet = getSurveyDedupSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return false;
  }
  return (
    sheet
      .getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(submissionId)
      .matchEntireCell(true)
      .findNext() !== null
  );
}

function recordSurveySubmissionId(submissionId, storeId, memberCode) {
  if (!submissionId) {
    return;
  }
  getSurveyDedupSheet().appendRow([submissionId, new Date(), storeId, memberCode]);
}

function getMemberCodeIndexSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("_survey_member_codes");
  if (!sheet) {
    sheet = ss.insertSheet("_survey_member_codes");
    sheet.hideSheet();
    sheet.appendRow(["memberCode"]);
  }
  return sheet;
}

function ensureMemberCodeIndex() {
  var sheet = getMemberCodeIndexSheet();
  if (sheet.getLastRow() <= 1) {
    rebuildMemberCodeIndex();
  }
}

function getMemberCodeColumnIndex(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    return SURVEY_MEMBER_CODE_COL;
  }
  var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < header.length; i++) {
    var label = String(header[i] || "").trim().toLowerCase();
    if (label === "membercode" || label.indexOf("会員") >= 0) {
      return i + 1;
    }
  }
  return SURVEY_MEMBER_CODE_COL;
}

function readMemberCodesFromAnswerSheet(sh) {
  var lastRow = sh.getLastRow();
  if (lastRow <= 1) {
    return [];
  }
  var col = getMemberCodeColumnIndex(sh);
  var numRows = lastRow - 1;
  var values = sh.getRange(2, col, numRows, 1).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var mc = normalizeMemberCode(values[i][0]);
    if (mc) {
      out.push(mc);
    }
  }
  return out;
}

/**
 * 既存の「回答_*」シートF列（会員番号）だけからインデックスを再構築。
 * 初回・手動実行: rebuildMemberCodeIndex()
 */
function rebuildMemberCodeIndex() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var indexSheet = getMemberCodeIndexSheet();
  var lastRow = indexSheet.getLastRow();
  if (lastRow > 1) {
    indexSheet.getRange(2, 1, lastRow - 1, 1).clearContent();
  }

  var seen = {};
  var rows = [];
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    if (String(sh.getName() || "").indexOf("回答_") !== 0) {
      continue;
    }
    var codes = readMemberCodesFromAnswerSheet(sh);
    for (var i = 0; i < codes.length; i++) {
      var mc = codes[i];
      if (seen[mc]) {
        continue;
      }
      seen[mc] = true;
      rows.push([mc]);
    }
  }

  if (rows.length) {
    indexSheet.getRange(2, 1, rows.length, 1).setValues(rows);
  }
}

function isMemberCodeInIndex(memberCodeNorm) {
  var sheet = getMemberCodeIndexSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return false;
  }
  return (
    sheet
      .getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(memberCodeNorm)
      .matchEntireCell(true)
      .findNext() !== null
  );
}

function isMemberCodeInAnswerSheets(memberCodeNorm) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    if (String(sh.getName() || "").indexOf("回答_") !== 0) {
      continue;
    }
    var codes = readMemberCodesFromAnswerSheet(sh);
    for (var i = 0; i < codes.length; i++) {
      if (codes[i] === memberCodeNorm) {
        return true;
      }
    }
  }
  return false;
}

function isMemberCodeRecorded(memberCode) {
  var memberCodeNorm = normalizeMemberCode(memberCode);
  if (!memberCodeNorm) {
    return false;
  }
  if (isMemberCodeInIndex(memberCodeNorm)) {
    return true;
  }
  return isMemberCodeInAnswerSheets(memberCodeNorm);
}

function recordMemberCode(memberCode) {
  var memberCodeNorm = normalizeMemberCode(memberCode);
  if (!memberCodeNorm || isMemberCodeInIndex(memberCodeNorm)) {
    return;
  }
  getMemberCodeIndexSheet().appendRow([memberCodeNorm]);
}

/** エディタから実行: testCheckRespondentByMemberCode("1304002222") */
function testCheckRespondentByMemberCode(memberCode) {
  var result = checkSurveyRespondent({ memberCode: memberCode });
  Logger.log(JSON.stringify(result));
  return result;
}

function getOrCreateSurveySheet(storeId, storeName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var base = ("回答_" + safeSheetName(storeName) + "_" + safeSheetName(storeId)).slice(0, 90);
  var sheet = ss.getSheetByName(base);
  if (sheet) return sheet;

  sheet = ss.insertSheet(base);
  sheet.appendRow([
    "timestamp",
    "storeId",
    "storeName",
    "rating",
    "fullName",
    "memberCode",
    "gender",
    "ageRange",
    "email",
    "visitDate",
    "notifyTo",
    "positives",
    "useScenes",
    "freeComment",
    "generatedReview",
    "submissionId",
  ]);
  return sheet;
}

function safeSheetName(value) {
  return String(value || "unknown")
    .replace(/[\\\/\?\*\[\]:]/g, "_")
    .trim()
    .slice(0, 40);
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [String(value)];
}

function sendLowRatingMail(data, to) {
  var storeName = String(data.storeName || "");
  var subject = "【" + storeName + "】お客様のお声";
  var body = [
    "店舗名: " + storeName,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "▼ この枠内にお問い合わせ内容をご記入ください ▼",
    "（気になった点 / ご要望 / 改善してほしい点 など）",
    "",
    "",
    "",
    "",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "今後のサービス向上の為、素直なご意見をいただければ幸いです。",
  ].join("\n");

  MailApp.sendEmail(to, subject, body);
}

// ---------------------------------------------------------------------------
// ポイント付与管理（?page=points）
// V列: ポイント付与済チェック / W列: 付与日時
// ---------------------------------------------------------------------------

var POINT_GRANT_CHECK_COL = 22;
var POINT_GRANT_AT_COL = 23;
var POINT_GRANT_HEADER = "ポイント付与済";
var POINT_GRANT_AT_HEADER = "付与日時";

function getPointGrantStoresForWeb() {
  var stores = readStoreRows();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = [];
  for (var i = 0; i < stores.length; i++) {
    var store = stores[i];
    var sheet = findSurveySheetByStoreId(store.id);
    out.push({
      id: store.id,
      name: store.name,
      hasSheet: !!sheet,
      sheetName: sheet ? sheet.getName() : "",
    });
  }
  return out;
}

function getPointGrantRowsForWeb(storeId) {
  try {
    var sheet = findSurveySheetByStoreId(storeId);
    if (!sheet) {
      return { ok: false, error: "この店舗の回答シートが見つかりません。" };
    }
    ensurePointGrantColumn(sheet);
    var cols = resolveSurveyColumns(sheet);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { ok: true, sheetName: sheet.getName(), rows: [], stats: emptyPointGrantStats() };
    }

    var width = Math.max(sheet.getLastColumn(), POINT_GRANT_AT_COL);
    var values = sheet.getRange(2, 1, lastRow - 1, width).getValues();
    var rows = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rowIndex = i + 2;
      var ts = row[cols.timestamp - 1];
      var fullName = String(row[cols.fullName - 1] || "").trim();
      var memberCode = normalizeMemberCode(row[cols.memberCode - 1]);
      if (!fullName && !memberCode && !ts) {
        continue;
      }
      var granted = row[POINT_GRANT_CHECK_COL - 1] === true;
      var grantedAtRaw = row[POINT_GRANT_AT_COL - 1];
      var grantedAt =
        granted && grantedAtRaw ? formatPointGrantDate(grantedAtRaw) : "";
      var rating = cols.rating ? row[cols.rating - 1] : "";
      rows.push({
        rowIndex: rowIndex,
        timestamp: formatPointGrantDate(ts),
        timestampSort: ts instanceof Date ? ts.getTime() : 0,
        fullName: fullName,
        memberCode: memberCode,
        rating: rating,
        granted: granted,
        grantedAt: grantedAt,
      });
    }

    rows.sort(function (a, b) {
      return b.timestampSort - a.timestampSort;
    });

    return {
      ok: true,
      sheetName: sheet.getName(),
      rows: rows,
      stats: buildPointGrantStats(rows),
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function setPointGrantedForWeb(sheetName, rowIndex, granted) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(String(sheetName || ""));
    if (!sheet) {
      return { ok: false, error: "シートが見つかりません。" };
    }
    var row = Number(rowIndex);
    if (!row || row < 2) {
      return { ok: false, error: "行が不正です。" };
    }
    ensurePointGrantColumn(sheet);
    var now = new Date();
    sheet.getRange(row, POINT_GRANT_CHECK_COL).setValue(granted === true);
    if (granted === true) {
      sheet.getRange(row, POINT_GRANT_AT_COL).setValue(now);
    } else {
      sheet.getRange(row, POINT_GRANT_AT_COL).clearContent();
    }
    return {
      ok: true,
      granted: granted === true,
      grantedAt: granted === true ? formatPointGrantDate(now) : "",
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function getPointGrantRowDetailForWeb(sheetName, rowIndex) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(String(sheetName || ""));
    if (!sheet) {
      return { ok: false, error: "シートが見つかりません。" };
    }
    var row = Number(rowIndex);
    if (!row || row < 2) {
      return { ok: false, error: "行が不正です。" };
    }
    var cols = resolveSurveyColumns(sheet);
    var width = Math.max(sheet.getLastColumn(), POINT_GRANT_AT_COL);
    var values = sheet.getRange(row, 1, row, width).getValues()[0];
    var granted = values[POINT_GRANT_CHECK_COL - 1] === true;
    var grantedAtRaw = values[POINT_GRANT_AT_COL - 1];
    var grantedAt =
      granted && grantedAtRaw ? formatPointGrantDate(grantedAtRaw) : "";

    return {
      ok: true,
      detail: {
        rowIndex: row,
        granted: granted,
        grantedAt: grantedAt,
        timestamp: formatPointGrantDate(values[cols.timestamp - 1]),
        storeId: cols.storeId ? String(values[cols.storeId - 1] || "") : "",
        storeName: cols.storeName ? String(values[cols.storeName - 1] || "") : "",
        rating: cols.rating ? String(values[cols.rating - 1] || "") : "",
        fullName: cols.fullName ? String(values[cols.fullName - 1] || "") : "",
        memberCode: cols.memberCode ? normalizeMemberCode(values[cols.memberCode - 1]) : "",
        gender: cols.gender ? String(values[cols.gender - 1] || "") : "",
        ageRange: cols.ageRange ? String(values[cols.ageRange - 1] || "") : "",
        email: cols.email ? String(values[cols.email - 1] || "") : "",
        visitDate: cols.visitDate ? String(values[cols.visitDate - 1] || "") : "",
        positives: cols.positives ? String(values[cols.positives - 1] || "") : "",
        useScenes: cols.useScenes ? String(values[cols.useScenes - 1] || "") : "",
        freeComment: cols.freeComment ? String(values[cols.freeComment - 1] || "") : "",
        generatedReview: cols.generatedReview ? String(values[cols.generatedReview - 1] || "") : "",
        submissionId: cols.submissionId ? String(values[cols.submissionId - 1] || "") : "",
      },
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function findSurveySheetByStoreId(storeId) {
  var sid = String(storeId || "").trim().toLowerCase();
  if (!sid) {
    return null;
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var suffix = "_" + sid;
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var name = sh.getName();
    if (name.indexOf("回答_") !== 0) {
      continue;
    }
    if (name.toLowerCase().slice(-suffix.length) === suffix) {
      return sh;
    }
  }
  var stores = readStoreRows();
  for (var i = 0; i < stores.length; i++) {
    if (String(stores[i].id || "").trim().toLowerCase() !== sid) {
      continue;
    }
    var expected = ("回答_" + safeSheetName(stores[i].name) + "_" + safeSheetName(stores[i].id)).slice(0, 90);
    var byName = ss.getSheetByName(expected);
    if (byName) {
      return byName;
    }
  }
  return null;
}

function resolveSurveyColumns(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 16);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var cols = {
    timestamp: findHeaderColumn(headers, ["timestamp", "日時", "回答日時"]),
    storeId: findHeaderColumn(headers, ["storeid", "店舗id"]),
    storeName: findHeaderColumn(headers, ["storename", "店舗名"]),
    rating: findHeaderColumn(headers, ["rating", "評価", "満足度"]),
    fullName: findHeaderColumn(headers, ["fullname", "名前", "氏名", "フルネーム"]),
    memberCode: findHeaderColumn(headers, ["membercode", "会員番号"]),
    gender: findHeaderColumn(headers, ["gender", "性別"]),
    ageRange: findHeaderColumn(headers, ["agerange", "年齢"]),
    email: findHeaderColumn(headers, ["email", "メール"]),
    visitDate: findHeaderColumn(headers, ["visitdate", "来店日", "利用日"]),
    positives: findHeaderColumn(headers, ["positives", "良かった点"]),
    useScenes: findHeaderColumn(headers, ["usescenes", "利用シーン", "シーン"]),
    freeComment: findHeaderColumn(headers, ["freecomment", "自由記述", "感想"]),
    generatedReview: findHeaderColumn(headers, ["generatedreview", "生成文", "口コミ文"]),
    submissionId: findHeaderColumn(headers, ["submissionid", "送信id"]),
  };
  if (!cols.timestamp) cols.timestamp = 1;
  if (!cols.fullName) cols.fullName = 5;
  if (!cols.memberCode) cols.memberCode = 6;
  if (!cols.rating) cols.rating = 4;
  if (!cols.storeName) cols.storeName = 3;
  return cols;
}

function findHeaderColumn(headers, candidates) {
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    for (var j = 0; j < candidates.length; j++) {
      var c = String(candidates[j]).toLowerCase().replace(/\s+/g, "");
      if (h === c || h.indexOf(c) >= 0) {
        return i + 1;
      }
    }
  }
  return 0;
}

function ensurePointGrantColumn(sheet) {
  cleanupExtraCheckboxColumns(sheet);
  var col = POINT_GRANT_CHECK_COL;
  var headerCell = sheet.getRange(1, col);
  var header = String(headerCell.getValue() || "").trim();
  if (!header) {
    headerCell.setValue(POINT_GRANT_HEADER);
  }
  var atHeaderCell = sheet.getRange(1, POINT_GRANT_AT_COL);
  var atHeader = String(atHeaderCell.getValue() || "").trim();
  if (!atHeader) {
    atHeaderCell.setValue(POINT_GRANT_AT_HEADER);
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return;
  }
  // getRange(row, col, numRows, numColumns) — V列1列だけ
  var numRows = lastRow - 1;
  var range = sheet.getRange(2, col, numRows, 1);
  try {
    range.insertCheckboxes();
  } catch (e) {
    // 既にチェックボックス
  }
}

/** X列以降に広がったチェックボックスを削除（W列=付与日時は保持） */
function cleanupExtraCheckboxColumns(sheet) {
  var atCol = POINT_GRANT_AT_COL;
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) {
    return;
  }
  var numRows = lastRow - 1;
  if (lastCol >= atCol) {
    sheet.getRange(2, atCol, numRows, 1).clearDataValidations();
  }
  if (lastCol > atCol) {
    var numExtraCols = lastCol - atCol;
    var extraRange = sheet.getRange(2, atCol + 1, numRows, numExtraCols);
    extraRange.clearDataValidations();
    extraRange.clearContent();
  }
}

/** エディタから1回実行: 全「回答_*」シートの余分なチェック列を修復 */
function repairAllSurveySheetCheckboxColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var count = 0;
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    if (String(sh.getName() || "").indexOf("回答_") !== 0) {
      continue;
    }
    cleanupExtraCheckboxColumns(sh);
    ensurePointGrantColumn(sh);
    count++;
  }
  Logger.log("repairAllSurveySheetCheckboxColumns: " + count + " sheets");
  return count;
}

function formatPointGrantDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, "Asia/Tokyo", "yyyy/MM/dd HH:mm");
  }
  return String(value || "").trim();
}

function emptyPointGrantStats() {
  return { total: 0, granted: 0, pending: 0 };
}

function buildPointGrantStats(rows) {
  var granted = 0;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].granted) {
      granted++;
    }
  }
  return {
    total: rows.length,
    granted: granted,
    pending: rows.length - granted,
  };
}

/**
 * WEST用ブックの初期体裁。店舗行は入れず、ヘッダーとガイドだけ整える。
 * エディタから1回実行してください。
 */
function setupWestWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    ss.rename(WEST_REGION_LABEL + " 口コミ APP");
  } catch (e) {}

  var guide = ensureNamedSheet_(ss, "はじめに", 0);
  styleGuideSheet_(guide);

  var stores = ensureNamedSheet_(ss, "店舗データ", 1);
  styleStoreMasterSheet_(stores);

  // 回答シート作成前の補助シート（初回回答時にも自動作成される）
  ensureNamedSheet_(ss, "_survey_dedup", 2);
  ensureNamedSheet_(ss, "_survey_member_codes", 3);
  styleHelperSheet_(ss.getSheetByName("_survey_dedup"), ["submissionId", "timestamp", "storeId", "memberCode"]);
  styleHelperSheet_(ss.getSheetByName("_survey_member_codes"), ["memberCode"]);

  // デフォルトの「シート1」など空シートを整理
  removeBlankDefaultSheets_(ss);

  return {
    ok: true,
    region: WEST_REGION_LABEL,
    spreadsheetName: ss.getName(),
    sheets: ss.getSheets().map(function (sh) {
      return sh.getName();
    }),
    storeHeaders: STORE_HEADERS,
    note: "店舗行は未投入。seedWestSampleStores() で関西サンプルを投入できます。",
  };
}

function mapsSearchUrl_(query) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
}

/**
 * WESTプレビュー用の関西サンプル店舗を「店舗データ」へ投入。
 * 通知メール（C列）は空欄。レビューURLはGoogleマップ検索（本番口コミURL確定前の仮）。
 * エディタから1回実行、または GET ?format=json&action=seedSampleStores
 */
function seedWestSampleStores() {
  setupWestWorkbook();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("店舗データ");
  if (!sheet) {
    return { ok: false, error: "店舗データ sheet missing" };
  }

  var samples = westSampleStoreRows_();
  var colCount = STORE_HEADERS.length;
  var last = Math.max(sheet.getLastRow(), 1);
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, colCount).clearContent();
  }
  sheet.getRange(2, 1, samples.length, colCount).setValues(samples);
  sheet
    .getRange(2, 1, samples.length, colCount)
    .setFontColor(WEST_COLOR.ink)
    .setFontStyle("normal");

  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }
  sheet.getRange(1, 1, samples.length + 1, colCount).createFilter();

  return {
    ok: true,
    count: samples.length,
    ids: samples.map(function (row) {
      return row[3];
    }),
  };
}

function westSampleStoreRows_() {
  // 公式サイト所在地ベース。座標は駅・施設付近（プレビュー用）
  return [
    [
      "JOYFIT24西梅田",
      mapsSearchUrl_("JOYFIT24西梅田 福島区福島7-21-11"),
      "",
      "nishiumeda",
      "大阪府大阪市福島区福島7-21-11 都島福島ビル2F・3F",
      34.6985,
      135.4868,
      "西梅田 にしうめだ 福島 ふくしま nishiumeda 大阪",
      "",
    ],
    [
      "JOYFIT24新大阪",
      mapsSearchUrl_("JOYFIT24新大阪 西中島5-1-4"),
      "",
      "shinosaka",
      "大阪府大阪市淀川区西中島5-1-4 モジュール新大阪2F・3F",
      34.7335,
      135.5003,
      "新大阪 しんおおさか shinosaka 西中島 大阪",
      "",
    ],
    [
      "JOYFIT24天六",
      mapsSearchUrl_("JOYFIT24天六 天神橋六丁目"),
      "",
      "tenroku",
      "大阪府大阪市北区天神橋六丁目7-12 EQUINIA106ビル2F・3F",
      34.7108,
      135.5108,
      "天六 てんろく 天神橋 てんじんばし tenroku 大阪",
      "",
    ],
    [
      "JOYFIT24南森町",
      mapsSearchUrl_("JOYFIT24南森町 東天満"),
      "",
      "minamimorimachi",
      "大阪府大阪市北区東天満2丁目10-41 双栄ビル2F・3F",
      34.6975,
      135.5115,
      "南森町 みなみもりまち minamimorimachi 大阪",
      "",
    ],
    [
      "JOYFIT24 三宮",
      mapsSearchUrl_("JOYFIT24三宮 下山手通"),
      "",
      "sannomiya",
      "兵庫県神戸市中央区下山手通2-13-3 建創ビル3F",
      34.6937,
      135.1955,
      "三宮 さんのみや 神戸 こうべ sannomiya 兵庫",
      "",
    ],
    [
      "JOYFIT24堀川今出川",
      mapsSearchUrl_("JOYFIT24堀川今出川"),
      "",
      "horikawaimadegawa",
      "京都府京都市上京区西堀川通元誓願寺上ル竪門前町400 竪門前ビル2F・3F",
      35.0295,
      135.748,
      "堀川今出川 ほりかわいまでがわ 京都 horikawa 今出川",
      "",
    ],
    [
      "FIT365天満橋",
      mapsSearchUrl_("FIT365天満橋 OMM別館"),
      "",
      "temmabashi",
      "大阪府大阪市中央区大手前1丁目7-31 OMM別館",
      34.6908,
      135.517,
      "天満橋 てんまばし temmabashi FIT365 大阪",
      "",
    ],
    [
      "FIT365門真打越",
      mapsSearchUrl_("FIT365門真打越 舟田町"),
      "",
      "kadomauchikoshi",
      "大阪府門真市舟田町1-3",
      34.732,
      135.587,
      "門真 かどま 打越 うちこし kadoma FIT365 大阪",
      "",
    ],
    [
      "FIT365南海堺東",
      mapsSearchUrl_("FIT365南海堺東"),
      "",
      "sakaihigashi",
      "大阪府堺市堺区三国ヶ丘御幸通59 南海堺東ビル7階",
      34.5753,
      135.4831,
      "堺東 さかいひがし sakaihigashi 南海 FIT365 堺",
      "",
    ],
    [
      "FIT365神戸エコール・リラ",
      mapsSearchUrl_("FIT365神戸エコール・リラ"),
      "",
      "ecolelilas",
      "兵庫県神戸市北区藤原台中町1-2-2 エコール・リラ ショッピングセンター本館2F",
      34.825,
      135.226,
      "エコールリラ おかば 岡場 神戸北区 ecolelilas FIT365 兵庫",
      "",
    ],
  ];
}

function ensureNamedSheet_(ss, name, index) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name, index);
  } else {
    try {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(index + 1);
    } catch (e) {}
  }
  return sheet;
}

function removeBlankDefaultSheets_(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    var name = String(sh.getName() || "");
    if (name === "シート1" || name === "Sheet1") {
      if (ss.getSheets().length > 1 && sh.getLastRow() === 0) {
        try {
          ss.deleteSheet(sh);
        } catch (e) {}
      }
    }
  }
}

function styleGuideSheet_(sheet) {
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setTabColor(WEST_COLOR.primaryDark);
  sheet.setFrozenRows(1);

  var title = [
    [WEST_REGION_LABEL + " 口コミ APP"],
    ["関東（EAST）とは別ブックです。店舗回答シートが増えても、EAST側のタブには影響しません。"],
    [""],
    ["■ このブックのシート"],
    ["はじめに … この説明"],
    ["店舗データ … 店舗マスタ（サイトの店舗一覧の元データ）"],
    ["_survey_dedup … 送信の重複防止（自動）"],
    ["_survey_member_codes … 会員番号インデックス（自動）"],
    ["回答_* … 店舗ごとの回答（アンケート送信時に自動作成）"],
    [""],
    ["■ 店舗データの列ルール（1行目ヘッダー固定）"],
    ["A 店舗名 | B レビューURL | C 低評価通知メール | D 店舗ID | E 住所 | F 緯度 | G 経度 | H 検索用 | I 特典文言（任意）"],
    ["※ 店舗名が未定の間はヘッダーのみ。2行目から追加。"],
    ["※ D列（店舗ID）は URL・回答シート名のキーになるので英数字の安定IDを推奨（例: umeda）。"],
    ["※ B列（Google口コミURL）が空の行はサイト一覧に出ません。"],
    [""],
    ["■ ポイント付与"],
    ["ウェブアプリ URL に ?page=points を付けて開く専用画面を使います（スプレッドシートのタブを直接見なくてOK）。"],
    [""],
    ["■ バナー画像"],
    ["リポジトリ: joyfit-review/public/west-kuchikomi-banner.png"],
    ["本番反映後: https://joyfit-review.vercel.app/west-kuchikomi-banner.png"],
  ];

  sheet.getRange(1, 1, title.length, 1).setValues(title);
  sheet.setColumnWidth(1, 920);
  sheet.getRange(1, 1).setFontFamily("Meiryo").setFontSize(18).setFontWeight("bold").setFontColor(WEST_COLOR.primaryDark);
  sheet.getRange(2, 1, title.length, 1).setFontFamily("Meiryo").setFontSize(11).setFontColor(WEST_COLOR.ink);
  sheet.getRange(1, 1, title.length, 1).setBackground(WEST_COLOR.guideBg).setWrap(true).setVerticalAlignment("middle");
  sheet.setRowHeight(1, 40);
  for (var r = 2; r <= title.length; r++) {
    sheet.setRowHeight(r, 26);
  }

  // バナー画像（公開URLが取れるようになったら表示）
  sheet.getRange(title.length + 2, 1).setFormula(
    '=IFERROR(IMAGE("https://joyfit-review.vercel.app/west-kuchikomi-banner.png"),"バナーはデプロイ後に表示されます")',
  );
  sheet.setRowHeight(title.length + 2, 180);
}

function styleStoreMasterSheet_(sheet) {
  var colCount = STORE_HEADERS.length;
  var maxStyleRows = 200;

  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setTabColor(WEST_COLOR.primary);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, colCount).setValues([STORE_HEADERS]);

  var header = sheet.getRange(1, 1, 1, colCount);
  header
    .setBackground(WEST_COLOR.primaryDark)
    .setFontColor(WEST_COLOR.white)
    .setFontFamily("Meiryo")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 34);

  var body = sheet.getRange(2, 1, maxStyleRows, colCount);
  body
    .setBackground(WEST_COLOR.white)
    .setFontFamily("Meiryo")
    .setFontSize(10)
    .setFontColor(WEST_COLOR.ink)
    .setVerticalAlignment("middle")
    .setWrap(true);

  for (var r = 2; r <= maxStyleRows; r++) {
    if (r % 2 === 0) {
      sheet.getRange(r, 1, r, colCount).setBackground(WEST_COLOR.zebra);
    }
  }

  var widths = [220, 280, 220, 140, 260, 100, 100, 220, 260];
  for (var c = 0; c < widths.length; c++) {
    sheet.setColumnWidth(c + 1, widths[c]);
  }

  // 入力例のプレースホルダ行（薄い注釈・サイトには出ない＝レビューURL空）
  sheet.getRange(2, 1, 1, colCount).setValues([
    [
      "（例）JOYFIT24〇〇",
      "",
      "store@example.com",
      "example-id",
      "大阪府…",
      "",
      "",
      "大阪 関西 example",
      "",
    ],
  ]);
  sheet
    .getRange(2, 1, 1, colCount)
    .setFontColor(WEST_COLOR.muted)
    .setFontStyle("italic");

  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), colCount).createFilter();

  sheet.getRange(1, 1).setNote(
    WEST_REGION_LABEL +
      "\n店舗が決まり次第、2行目の例を消して本データを入れてください。\nB列（レビューURL）必須・D列（店舗ID）推奨。",
  );
}

function styleHelperSheet_(sheet, headers) {
  sheet.clear();
  sheet.setTabColor("#a1a1aa");
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet
    .getRange(1, 1, 1, headers.length)
    .setBackground("#3f3f46")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setFontFamily("Meiryo");
  for (var i = 0; i < headers.length; i++) {
    sheet.setColumnWidth(i + 1, 160);
  }
}
