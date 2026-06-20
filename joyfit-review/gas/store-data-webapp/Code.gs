/**
 * 店舗マスタJSON（GET）＋ 低評価フィードバックメール送信（POST）
 *
 * デプロイ: ウェブアプリ
 * - 実行: 自分
 * - アクセス: 全員（または組織内）
 * URL を Next.js の STORES_JSON_URL に設定（GET/POST 共通）
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
