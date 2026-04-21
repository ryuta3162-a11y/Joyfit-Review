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

    if (action === "survey") {
      var result = saveSurveyResponse(data);
      if (!result.ok) {
        return outputJson(result);
      }
      if (result.shouldNotify) {
        sendLowRatingMail(data, result.to);
      }
      return outputJson({ ok: true, savedSheet: result.sheetName });
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

function saveSurveyResponse(data) {
  var storeId = String(data.storeId || "").trim() || "unknown";
  var storeName = String(data.storeName || "").trim() || "unknown";
  var rating = Number(data.rating || 0);
  if (!rating) {
    return { ok: false, error: "rating is required" };
  }

  var to = String(data.to || "").trim();
  var sheet = getOrCreateSurveySheet(storeId, storeName);
  sheet.appendRow([
    new Date(),
    storeId,
    storeName,
    rating,
    String(data.fullName || "").trim(),
    String(data.memberCode || "").trim(),
    String(data.gender || "").trim(),
    String(data.ageRange || "").trim(),
    String(data.email || "").trim(),
    String(data.visitDate || "").trim(),
    to,
    toArray(data.positives).join(" / "),
    toArray(data.useScenes).join(" / "),
    String(data.freeComment || "").trim(),
    String(data.generatedReview || "").trim(),
  ]);

  var skipAutoMail = String(data.skipAutoMail || "").toLowerCase() === "true" || data.skipAutoMail === true;

  return {
    ok: true,
    to: to,
    shouldNotify: rating <= 3 && to.indexOf("@") >= 0 && !skipAutoMail,
    sheetName: sheet.getName(),
  };
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
  var subject = "【" + storeName + "】口コミアンケートフィードバック";
  var body = [
    "店舗名: " + storeName,
    "評価: 星" + String(data.rating || ""),
    "氏名: " + String(data.fullName || ""),
    "会員番号: " + String(data.memberCode || ""),
    "送信者メール(入力値): " + String(data.email || ""),
    "",
    "--- ご要望 / お声 ---",
    "⇩下記に内容をご記入下さい⇩",
    "",
    "------------------------------",
    "今後のサービス向上の為、素直なご意見をいただければ幸いです。",
  ].join("\n");

  MailApp.sendEmail(to, subject, body);
}
