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
 *   A 店舗名 | B レビューURL | C 低評価通知メール | D 店舗ID | E 検索用
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

function doGet() {
  const rows = readStoreRows();
  return outputJson(rows);
}

/**
 * 低評価フィードバック用。Next.js のサーバーから JSON POST される想定。
 * body: { "to": "a@x.com,b@y.com", "subject": "...", "body": "..." }
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return outputJson({ ok: false, error: "empty body" });
    }
    var data = JSON.parse(e.postData.contents);
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

    var feedbackEmail = "";
    var id = "";
    var searchText = "";

    if (c.indexOf("@") >= 0) {
      feedbackEmail = c;
      id = d || "row" + (i + 1);
      searchText = e || defaultSearchText(name, id);
    } else {
      id = c || "row" + (i + 1);
      searchText = d || defaultSearchText(name, id);
    }

    out.push({
      id: id,
      name: name,
      searchText: searchText,
      googleReviewUrl: googleReviewUrl,
      feedbackEmail: feedbackEmail,
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

function defaultSearchText(name, id) {
  return [name, id].filter(Boolean).join(" ");
}
