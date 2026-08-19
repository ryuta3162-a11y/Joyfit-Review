/**
 * 店舗マスタJSON（GET）＋ 低評価フィードバックメール送信（POST）
 *
 * デプロイ: ウェブアプリ
 * - 実行: 自分
 * - アクセス: 全員（または組織内）
 * URL を Next.js の STORES_JSON_URL に設定（GET/POST 共通）
 *
 * ポイント付与管理: 別GAS（社内専用）。このプロジェクトには置かない。
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
        storeId: e.parameter.storeId,
      }),
    );
  }
  if (format === "json") {
    var rows = readStoreRows();
    return outputJson(rows);
  }

  // ブラウザで直開きする画面は置かない（店舗JSON・保存は format=json / doPost）
  return HtmlService.createHtmlOutput("").setTitle("JOYFIT");
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return outputJson({ ok: false, error: "empty body" });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || "").trim();

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

    if (c.indexOf("@") >= 0) {
      feedbackEmail = c;
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
var memberCodeSetCache_ = null;

function normalizeMemberCode(value) {
  var mc = String(value || "").trim().replace(/\D/g, "");
  if (!/^\d{10}$/.test(mc) || /^0{10}$/.test(mc)) {
    return "";
  }
  return mc;
}

function checkSurveyRespondent(data) {
  try {
    var memberCodeNorm = normalizeMemberCode(data.memberCode);
    if (!memberCodeNorm) {
      return { ok: true, eligible: true };
    }
    var storeId = String(data.storeId || "").trim();
    if (!storeId) {
      return { ok: false, error: "storeId is required" };
    }
    var sheet = findSurveySheetByStoreId(storeId);
    if (!sheet) {
      return { ok: true, eligible: true };
    }
    if (isMemberCodeOnSheet_(sheet, memberCodeNorm)) {
      return { ok: true, eligible: false, matchedBy: "memberCode" };
    }
    return { ok: true, eligible: true };
  } catch (e) {
    return { ok: false, error: "check failed: " + String(e && e.message ? e.message : e) };
  }
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
  if (!lock.tryLock(8000)) {
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

    if (submissionId) {
      recordSurveySubmissionId(submissionId, storeId, memberCode);
    }

    appendSurveyRecord_(sheet, {
      timestamp: new Date(),
      storeId: storeId,
      storeName: storeName,
      rating: rating,
      fullName: respondentFullName,
      memberCode: memberCode,
      gender: String(data.gender || "").trim(),
      ageRange: String(data.ageRange || "").trim(),
      email: email,
      visitDate: String(data.visitDate || "").trim(),
      notifyTo: to,
      positives: toArray(data.positives).join(" / "),
      useScenes: toArray(data.useScenes).join(" / "),
      freeComment: String(data.freeComment || "").trim(),
      generatedReview: String(data.generatedReview || "").trim(),
      submissionId: submissionId,
    });

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

function submissionIdCacheKey_(submissionId) {
  return "sid_" + String(submissionId || "").slice(0, 80);
}

function submissionIdCachePut_(submissionId) {
  if (!submissionId) {
    return;
  }
  try {
    CacheService.getScriptCache().put(submissionIdCacheKey_(submissionId), "1", 21600);
  } catch (e) {}
}

function isSubmissionIdRecorded(submissionId) {
  if (!submissionId) {
    return false;
  }
  try {
    if (CacheService.getScriptCache().get(submissionIdCacheKey_(submissionId)) === "1") {
      return true;
    }
  } catch (e) {}
  var sheet = getSurveyDedupSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return false;
  }
  var windowSize = 200;
  var startRow = Math.max(2, lastRow - windowSize + 1);
  var numRows = lastRow - startRow + 1;
  var values = sheet.getRange(startRow, 1, numRows, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || "") === submissionId) {
      submissionIdCachePut_(submissionId);
      return true;
    }
  }
  return false;
}

function recordSurveySubmissionId(submissionId, storeId, memberCode) {
  if (!submissionId) {
    return;
  }
  submissionIdCachePut_(submissionId);
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

function loadMemberCodeSet_() {
  if (memberCodeSetCache_) {
    return memberCodeSetCache_;
  }
  var set = {};
  var sheet = getMemberCodeIndexSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      var mc = normalizeMemberCode(values[i][0]);
      if (mc) {
        set[mc] = true;
      }
    }
  }
  memberCodeSetCache_ = set;
  return set;
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

  var indexSheet = getMemberCodeIndexSheet();
  var lastRow = indexSheet.getLastRow();
  if (lastRow > 1) {
    indexSheet.getRange(2, 1, lastRow - 1, 1).clearContent();
  }
  if (rows.length) {
    indexSheet.getRange(2, 1, rows.length, 1).setValues(rows);
  }
  memberCodeSetCache_ = seen;
}

function isMemberCodeInIndex(memberCodeNorm) {
  return !!loadMemberCodeSet_()[memberCodeNorm];
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

function memberCodeCacheGet_(memberCodeNorm) {
  try {
    return CacheService.getScriptCache().get("mc_" + memberCodeNorm);
  } catch (e) {
    return null;
  }
}

function memberCodeCachePut_(memberCodeNorm) {
  try {
    CacheService.getScriptCache().put("mc_" + memberCodeNorm, "1", 21600);
  } catch (e) {}
}

function isMemberCodeRecorded(memberCode) {
  var memberCodeNorm = normalizeMemberCode(memberCode);
  if (!memberCodeNorm) {
    return false;
  }
  if (memberCodeCacheGet_(memberCodeNorm) === "1") {
    return true;
  }
  if (isMemberCodeInIndex(memberCodeNorm)) {
    memberCodeCachePut_(memberCodeNorm);
    return true;
  }
  return false;
}

function recordMemberCode(memberCode) {
  var memberCodeNorm = normalizeMemberCode(memberCode);
  if (!memberCodeNorm) {
    return;
  }
  var set = loadMemberCodeSet_();
  if (set[memberCodeNorm]) {
    return;
  }
  getMemberCodeIndexSheet().appendRow([memberCodeNorm]);
  set[memberCodeNorm] = true;
  memberCodeCachePut_(memberCodeNorm);
}

/** エディタから実行: testCheckRespondentByMemberCode("1304002222", "kyodo") */
function testCheckRespondentByMemberCode(memberCode, storeId) {
  var result = checkSurveyRespondent({ memberCode: memberCode, storeId: storeId });
  Logger.log(JSON.stringify(result));
  return result;
}

function surveySheetCacheKey_(storeId) {
  return "sh_" + safeSheetName(storeId).slice(0, 80);
}

function cacheSurveySheetName_(storeId, sheetName) {
  if (!storeId || !sheetName) {
    return;
  }
  try {
    CacheService.getScriptCache().put(surveySheetCacheKey_(storeId), sheetName, 21600);
  } catch (e) {}
}

function findSurveySheetByStoreId(storeId) {
  var wantedId = safeSheetName(storeId);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var cachedName = CacheService.getScriptCache().get(surveySheetCacheKey_(storeId));
    if (cachedName) {
      var cachedSheet = ss.getSheetByName(cachedName);
      if (cachedSheet) {
        return cachedSheet;
      }
    }
  } catch (e) {}

  var suffix = "_" + wantedId;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = String(sheets[i].getName() || "");
    if (name.indexOf("回答_") === 0 && name.slice(-suffix.length).toLowerCase() === suffix.toLowerCase()) {
      cacheSurveySheetName_(storeId, name);
      return sheets[i];
    }
  }
  return null;
}

function getOrCreateSurveySheet(storeId, storeName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var wantedId = safeSheetName(storeId);
  var exact = ("回答_" + safeSheetName(storeName) + "_" + wantedId).slice(0, 90);
  var sheet = ss.getSheetByName(exact);
  if (sheet) {
    cacheSurveySheetName_(storeId, exact);
    return sheet;
  }

  sheet = findSurveySheetByStoreId(storeId);
  if (sheet) return sheet;

  sheet = ss.insertSheet(exact);
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
  cacheSurveySheetName_(storeId, exact);
  return sheet;
}

var SURVEY_HEADER_ALIASES_ = {
  timestamp: ["timestamp"],
  storeId: ["storeId"],
  storeName: ["storeName"],
  rating: ["rating"],
  fullName: ["fullName", "氏名", "名前"],
  memberCode: ["memberCode", "会員番号"],
  gender: ["gender", "性別"],
  ageRange: ["ageRange", "年齢"],
  email: ["email"],
  visitDate: ["visitDate"],
  notifyTo: ["notifyTo"],
  positives: ["positives"],
  useScenes: ["useScenes"],
  freeComment: ["freeComment"],
  generatedReview: ["generatedReview"],
  submissionId: ["submissionId"],
};

function appendSurveyRecord_(sheet, record) {
  sheet.appendRow([
    record.timestamp,
    record.storeId,
    record.storeName,
    record.rating,
    record.fullName,
    record.memberCode,
    record.gender,
    record.ageRange,
    record.email,
    record.visitDate,
    record.notifyTo,
    record.positives,
    record.useScenes,
    record.freeComment,
    record.generatedReview,
    record.submissionId,
  ]);
}

function isMemberCodeOnSheet_(sheet, memberCode) {
  var memberCodeNorm = normalizeMemberCode(memberCode);
  if (!memberCodeNorm) {
    return false;
  }
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var col = 6;
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || "").trim();
    if (key === "memberCode" || key === "会員番号") {
      col = i + 1;
    }
  }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return false;
  }
  var values = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (var r = 0; r < values.length; r++) {
    if (normalizeMemberCode(values[r][0]) === memberCodeNorm) {
      return true;
    }
  }
  return false;
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
