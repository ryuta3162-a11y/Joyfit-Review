/**
 * 店舗マスタJSON（GET）＋ 低評価フィードバックメール送信（POST）
 *
 * デプロイ: ウェブアプリ
 * - 実行: 自分
 * - アクセス: 全員（または組織内）
 * URL を Next.js の STORES_JSON_URL に設定（GET/POST 共通）
 *
 * シート名: 店舗データ
 *
 * 【推奨レイアウト】1行目ヘッダー例:
 *   A 店舗名 | B レビューURL | C 低評価通知メール | D 店舗ID | E 住所 | F 緯度 | G 経度 | H 検索用
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
  if (format === "json") {
    var rows = readStoreRows();
    return outputJson(rows);
  }

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

function normalizeSurveyEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeSurveyFullName(value) {
  return String(value || "")
    .trim()
    .replace(/[\s\u3000]+/g, "")
    .toLowerCase();
}

function checkSurveyRespondent(data) {
  ensureRespondentIndex();
  var emailNorm = normalizeSurveyEmail(data.email);
  var nameNorm = normalizeSurveyFullName(data.fullName);
  if (!emailNorm && nameNorm.length < 2) {
    return { ok: true, eligible: true };
  }
  var match = findRespondentMatch(emailNorm, nameNorm);
  if (match) {
    return { ok: true, eligible: false, matchedBy: match.matchedBy };
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
  var emailNorm = normalizeSurveyEmail(email);
  var nameNorm = normalizeSurveyFullName(respondentFullName);

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

    ensureRespondentIndex();
    var existing = findRespondentMatch(emailNorm, nameNorm);
    if (existing) {
      return { ok: false, error: "already_answered", matchedBy: existing.matchedBy };
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
    recordRespondent(emailNorm, nameNorm, respondentFullName, email, storeId, memberCode);

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
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0] || "") === submissionId) {
      return true;
    }
  }
  return false;
}

function recordSurveySubmissionId(submissionId, storeId, memberCode) {
  if (!submissionId) {
    return;
  }
  getSurveyDedupSheet().appendRow([submissionId, new Date(), storeId, memberCode]);
}

function getRespondentIndexSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("_survey_respondents");
  if (!sheet) {
    sheet = ss.insertSheet("_survey_respondents");
    sheet.hideSheet();
    sheet.appendRow([
      "emailNorm",
      "fullNameNorm",
      "fullName",
      "email",
      "storeId",
      "timestamp",
      "memberCode",
    ]);
  }
  return sheet;
}

function ensureRespondentIndex() {
  var sheet = getRespondentIndexSheet();
  if (sheet.getLastRow() <= 1) {
    rebuildRespondentIndex();
  }
}

/**
 * 既存の「回答_*」シートから回答者インデックスを再構築（初回・手動実行用）。
 */
function rebuildRespondentIndex() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var indexSheet = getRespondentIndexSheet();
  var lastRow = indexSheet.getLastRow();
  if (lastRow > 1) {
    indexSheet.getRange(2, 1, lastRow, 7).clearContent();
  }

  var seen = {};
  var rows = [];
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    if (String(sh.getName() || "").indexOf("回答_") !== 0) {
      continue;
    }
    var values = sh.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var fn = String(row[4] || "").trim();
      var em = String(row[8] || "").trim();
      var emailNorm = normalizeSurveyEmail(em);
      var nameNorm = normalizeSurveyFullName(fn);
      if (!emailNorm && nameNorm.length < 2) {
        continue;
      }
      var dedupeKey = (emailNorm ? "e:" + emailNorm : "") + "|" + (nameNorm ? "n:" + nameNorm : "");
      if (seen[dedupeKey]) {
        continue;
      }
      seen[dedupeKey] = true;
      rows.push([
        emailNorm,
        nameNorm,
        fn,
        em,
        String(row[1] || ""),
        row[0] instanceof Date ? row[0] : new Date(),
        String(row[5] || ""),
      ]);
    }
  }

  if (rows.length) {
    indexSheet.getRange(2, 1, 1 + rows.length, 7).setValues(rows);
  }
}

function findRespondentMatch(emailNorm, nameNorm) {
  var sheet = getRespondentIndexSheet();
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var rowEmail = String(values[i][0] || "");
    var rowName = String(values[i][1] || "");
    if (emailNorm && rowEmail && rowEmail === emailNorm) {
      return { matchedBy: "email" };
    }
    if (nameNorm.length >= 2 && rowName && rowName === nameNorm) {
      return { matchedBy: "name" };
    }
  }
  return null;
}

function recordRespondent(emailNorm, nameNorm, fullName, email, storeId, memberCode) {
  if (!emailNorm && nameNorm.length < 2) {
    return;
  }
  getRespondentIndexSheet().appendRow([
    emailNorm,
    nameNorm,
    fullName,
    email,
    storeId,
    new Date(),
    memberCode,
  ]);
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
