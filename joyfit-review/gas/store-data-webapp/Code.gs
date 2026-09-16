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
 * 【推奨レイアウト】6行目ヘッダー例:
 *   A ブランド | B 店舗名 | C レビューURL | D 低評価通知メール | E 店舗ID | F 住所 | G 緯度 | H 経度 | I 検索用 | J 特典文言
 *
 * A列ブランドはプルダウン（JOYFIT / FIT365 / YOGA）。LPのブランド振り分けに使う。
 * 体裁整備: GET ?format=json&action=rebuildStoreMaster
 *   （バックアップシート作成 → 上段に店舗数 → 6行目ヘッダー → 7行目〜データ）
 *
 * 【互換】ヘッダー名で列を判定（旧: A=店舗名 / J=ブランド も読める）
 *
 * 【重要】MailApp 初回エラー「script.send_mail の権限がない」が出るとき:
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
  if (action === "ping") {
    try {
      SpreadsheetApp.getActiveSpreadsheet().getId();
    } catch (err) {}
    return outputJson({ ok: true, ping: true });
  }
  if (format === "json" && action === "checkRespondent") {
    return outputJson(
      checkSurveyRespondent({
        memberCode: e.parameter.memberCode,
        storeId: e.parameter.storeId,
      }),
    );
  }
  if (format === "json" && action === "formatStoreBrands") {
    return outputJson(rebuildStoreMasterForStaff());
  }
  if (format === "json" && action === "rebuildStoreMaster") {
    return outputJson(rebuildStoreMasterForStaff());
  }
  if (format === "json" && action === "clearStoreRowColors") {
    return outputJson(clearStoreDataRowColors());
  }
  if (format === "json" && action === "debugStoreSheet") {
    return outputJson(debugStoreSheet_());
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

  var headerIndex = findStoreHeaderRowIndex_(values);
  var colMap =
    headerIndex >= 0 ? buildStoreColMap_(values[headerIndex]) : buildLegacyStoreColMap_();
  var startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;

  var out = [];
  for (var i = startIndex; i < values.length; i++) {
    var parsed = parseStoreMasterRow_(values[i], colMap, i + 1);
    if (!parsed) continue;
    out.push(parsed);
  }

  return out;
}

var STORE_BRAND_COL = 1; // A列
var STORE_HEADER_ROW = 6;
var STORE_DATA_START_ROW = 7;
var STORE_BRAND_HEADER = "ブランド";
var STORE_BRAND_OPTIONS = ["JOYFIT", "FIT365", "YOGA"];
/** 新レイアウト: Aブランド → 右へスライド */
var STORE_HEADERS = [
  "ブランド",
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
/** スタッフが見やすい少し濃い色 */
var STORE_BRAND_COLOR = {
  JOYFIT: "#E8A0AE",
  FIT365: "#F0A0BC",
  YOGA: "#7EC8C8",
};

function findStoreHeaderRowIndex_(values) {
  var maxScan = Math.min(values.length, 30);
  for (var i = 0; i < maxScan; i++) {
    var row = values[i] || [];
    for (var c = 0; c < row.length; c++) {
      var cell = String(row[c] || "").trim();
      if (cell === "店舗名" || cell.indexOf("店舗名") === 0) {
        return i;
      }
    }
    if (isHeaderRow(String(row[0] || "").trim())) {
      return i;
    }
  }
  return -1;
}

function buildStoreColMap_(headerRow) {
  var idx = {};
  for (var i = 0; i < headerRow.length; i++) {
    var h = String(headerRow[i] || "").trim();
    if (h && idx[h] == null) idx[h] = i;
  }
  function pick(keys, fallback) {
    for (var k = 0; k < keys.length; k++) {
      if (idx[keys[k]] != null) return idx[keys[k]];
    }
    return fallback;
  }
  return {
    brand: pick(["ブランド"], -1),
    name: pick(["店舗名", "名前"], 0),
    url: pick(["レビューURL", "口コミURL"], 1),
    email: pick(["低評価通知メール", "通知メール"], 2),
    id: pick(["店舗ID"], 3),
    address: pick(["住所"], 4),
    lat: pick(["緯度"], 5),
    lng: pick(["経度"], 6),
    search: pick(["検索用"], 7),
    reward: pick(["特典文言"], 8),
  };
}

/** ヘッダー無しの旧データ向け（A=店舗名） */
function buildLegacyStoreColMap_() {
  return {
    brand: 9,
    name: 0,
    url: 1,
    email: 2,
    id: 3,
    address: 4,
    lat: 5,
    lng: 6,
    search: 7,
    reward: 8,
  };
}

function cellAt_(row, index) {
  if (index == null || index < 0) return "";
  return row[index];
}

function parseStoreMasterRow_(row, colMap, sheetRowNumber) {
  var name = String(cellAt_(row, colMap.name) || "").trim();
  var googleReviewUrl = String(cellAt_(row, colMap.url) || "").trim();
  if (!name || !googleReviewUrl) return null;
  if (isHeaderRow(name) || isDashboardLabel_(name)) return null;

  var email = String(cellAt_(row, colMap.email) || "").trim();
  var id = String(cellAt_(row, colMap.id) || "").trim();
  var address = String(cellAt_(row, colMap.address) || "").trim();
  var searchText = String(cellAt_(row, colMap.search) || "").trim();
  var rewardLabel = String(cellAt_(row, colMap.reward) || "").trim();
  var brandRaw = String(cellAt_(row, colMap.brand) || "").trim();
  if (brandRaw === STORE_BRAND_HEADER || brandRaw === "ブランド") brandRaw = "";

  // 旧互換: メール列に店舗IDが入っている場合
  if (email && email.indexOf("@") < 0 && !id) {
    id = email;
    email = "";
    if (!searchText) {
      searchText = address;
      address = "";
    }
  }

  if (!id) id = "row" + sheetRowNumber;
  if (!searchText) searchText = defaultSearchText(name, id, address);

  var brand = normalizeStoreBrandLabel_(brandRaw) || detectStoreBrandLabelFromName_(name);

  return {
    id: id,
    name: name,
    searchText: searchText,
    googleReviewUrl: googleReviewUrl,
    feedbackEmail: email.indexOf("@") >= 0 ? email : "",
    address: address,
    latitude: parseCoordinate(cellAt_(row, colMap.lat)),
    longitude: parseCoordinate(cellAt_(row, colMap.lng)),
    rewardLabel: rewardLabel,
    brand: brandToApi_(brand),
    brandLabel: brand,
  };
}

function isDashboardLabel_(name) {
  var n = String(name || "").trim();
  if (!n) return true;
  if (n === STORE_BRAND_HEADER || n === "ブランド別店舗数" || n === "合計") return true;
  if (n.indexOf("EAST") === 0 && n.indexOf("店舗") >= 0) return true;
  if (n.indexOf("使い方") === 0) return true;
  for (var i = 0; i < STORE_BRAND_OPTIONS.length; i++) {
    if (n === STORE_BRAND_OPTIONS[i]) return true;
  }
  return false;
}

/**
 * 見やすい店舗マスタに作り直す（入力内容は保持）。
 * A=ブランド（プルダウン） / B=店舗名 … と右へスライド。
 */
function rebuildStoreMasterForStaff() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("店舗データ");
  if (!sheet) {
    return { ok: false, error: "店舗データ sheet missing" };
  }

  ensureStoreDataNotEmpty_(ss, sheet);

  var collected = collectStoreMasterRows_(sheet);
  if (!collected.length) {
    ensureStoreDataNotEmpty_(ss, sheet);
    collected = collectStoreMasterRows_(sheet);
  }
  if (!collected.length) {
    return { ok: false, error: "店舗データが空です。バックアップシートから手動復元してください。" };
  }

  var backupName = backupStoreDataSheet_(sheet);
  try {
    replaceStoreMasterSheet_(ss, collected);
  } catch (err) {
    restoreStoreDataFromBackup_(ss, ss.getSheetByName("店舗データ") || sheet, backupName);
    return {
      ok: false,
      error: String(err),
      backupSheet: backupName,
      restored: true,
    };
  }

  return {
    ok: true,
    backupSheet: backupName,
    storeCount: collected.length,
    headerRow: STORE_HEADER_ROW,
    dataStartRow: STORE_DATA_START_ROW,
    layout: "A=ブランド, B=店舗名, …",
    note: "バックアップ作成済み。A列ブランド（選択式）・B列店舗名で作り直しました。",
  };
}

function ensureStoreDataNotEmpty_(ss, sheet) {
  var probe = collectStoreMasterRows_(sheet);
  if (probe.length > 0) {
    return;
  }
  var backups = ss.getSheets().filter(function (sh) {
    return String(sh.getName() || "").indexOf("店舗データ_backup_") === 0;
  });
  if (!backups.length) {
    return;
  }
  backups.sort(function (a, b) {
    return String(b.getName()).localeCompare(String(a.getName()));
  });
  restoreStoreDataFromBackup_(ss, sheet, backups[0].getName());
}

function restoreStoreDataFromBackup_(ss, sheet, backupName) {
  var backup = ss.getSheetByName(backupName);
  if (!backup) {
    return false;
  }
  var existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }
  sheet.clear();
  sheet.clearConditionalFormatRules();
  var range = backup.getDataRange();
  var values = range.getValues();
  if (values.length && values[0].length) {
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  }
  return true;
}

/** 互換: 旧アクション名 */
function formatStoreBrandSheet() {
  return rebuildStoreMasterForStaff();
}

function backupStoreDataSheet_(sheet) {
  var ss = sheet.getParent();
  var stamp = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyyMMdd_HHmm");
  var name = ("店舗データ_backup_" + stamp).slice(0, 90);
  var existing = ss.getSheetByName(name);
  if (existing) {
    name = (name + "_" + String(Date.now()).slice(-4)).slice(0, 90);
  }
  var copy = sheet.copyTo(ss);
  copy.setName(name);
  try {
    ss.setActiveSheet(copy);
    ss.moveActiveSheet(ss.getNumSheets());
  } catch (e) {}
  return name;
}

/** @return {Array} 新レイアウト行 [ブランド, 店舗名, URL, メール, ID, 住所, 緯度, 経度, 検索, 特典] */
function collectStoreMasterRows_(sheet) {
  var values = sheet.getDataRange().getValues();
  var headerIndex = findStoreHeaderRowIndex_(values);
  var colMap =
    headerIndex >= 0 ? buildStoreColMap_(values[headerIndex]) : buildLegacyStoreColMap_();
  var startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  var rows = [];
  var seen = {};

  for (var i = startIndex; i < values.length; i++) {
    var parsed = parseStoreMasterRow_(values[i], colMap, i + 1);
    if (!parsed) continue;
    var key = String(parsed.id || parsed.name).toLowerCase();
    if (seen[key]) continue;
    seen[key] = true;
    rows.push([
      parsed.brandLabel || detectStoreBrandLabelFromName_(parsed.name),
      parsed.name,
      parsed.googleReviewUrl,
      parsed.feedbackEmail || "",
      parsed.id,
      parsed.address || "",
      parsed.latitude == null ? "" : parsed.latitude,
      parsed.longitude == null ? "" : parsed.longitude,
      parsed.searchText || "",
      parsed.rewardLabel || "",
    ]);
  }

  return rows;
}

function writeStoreMasterLayout_(sheet, rows) {
  var existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }

  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.setFrozenRows(0);
  SpreadsheetApp.flush();

  // --- ダッシュボード（最小限）---
  sheet.getRange("A1").setValue("EAST 口コミ｜店舗マスタ");
  sheet.getRange("A1").setFontWeight("bold").setFontSize(14);

  sheet.getRange("A3").setValue("JOYFIT");
  sheet.getRange("B3").setFormula('=COUNTIF(A7:A2000,"JOYFIT")');
  sheet.getRange("C3").setValue("FIT365");
  sheet.getRange("D3").setFormula('=COUNTIF(A7:A2000,"FIT365")');
  sheet.getRange("E3").setValue("YOGA");
  sheet.getRange("F3").setFormula('=COUNTIF(A7:A2000,"YOGA")');
  sheet.getRange("G3").setValue("合計");
  sheet.getRange("H3").setFormula("=B3+D3+F3");

  sheet.getRange("A3").setBackground(STORE_BRAND_COLOR.JOYFIT).setFontWeight("bold");
  sheet.getRange("C3").setBackground(STORE_BRAND_COLOR.FIT365).setFontWeight("bold");
  sheet.getRange("E3").setBackground(STORE_BRAND_COLOR.YOGA).setFontWeight("bold");
  sheet.getRange("G3").setFontWeight("bold");
  sheet.getRange("H3").setFontWeight("bold");
  sheet.getRange("A3:H3").setBorder(true, true, true, true, true, true);
  sheet.getRange("B3:H3").setHorizontalAlignment("center");

  sheet.getRange("A4").setValue("バックアップ: 店舗データ_backup_日時");
  sheet.getRange("A5").setValue("");

  // --- ヘッダー（6行目）---
  sheet.getRange("A6:J6").setValues([STORE_HEADERS]);
  sheet.getRange("A6:J6").setFontWeight("bold").setBackground("#334155").setFontColor("#FFFFFF");

  if (!rows || !rows.length) {
    throw new Error("writeStoreMasterLayout_: rows empty");
  }

  var normalized = [];
  for (var i = 0; i < rows.length; i++) {
    var src = rows[i] || [];
    var line = [];
    for (var c = 0; c < STORE_HEADERS.length; c++) {
      line.push(src[c] == null ? "" : src[c]);
    }
    // 新レイアウト: 0=ブランド, 1=店舗名
    var brand = normalizeStoreBrandLabel_(line[0]) || detectStoreBrandLabelFromName_(String(line[1] || ""));
    line[0] = brand;
    normalized.push(line);
  }

  var endRow = STORE_DATA_START_ROW + normalized.length - 1;
  sheet.getRange("A7:J" + endRow).setValues(normalized);
  SpreadsheetApp.flush();

  try {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(STORE_BRAND_OPTIONS, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange("A7:A" + endRow).setDataValidation(rule);
  } catch (eVal) {
    try {
      var rule2 = SpreadsheetApp.newDataValidation()
        .requireValueInList(STORE_BRAND_OPTIONS, true)
        .setAllowInvalid(true)
        .build();
      sheet.getRange("A7:A" + endRow).setDataValidation(rule2);
    } catch (eVal2) {}
  }

  // データ行の全面色分けは見づらいため付けない（上段カウントとヘッダーのみ色付き）
  SpreadsheetApp.flush();

  try {
    sheet.getRange("A6:J" + endRow).createFilter();
  } catch (e2) {}

  sheet.setFrozenRows(STORE_HEADER_ROW);
  SpreadsheetApp.flush();

  var checkBrand = String(sheet.getRange("A7").getValue() || "").trim();
  var checkName = String(sheet.getRange("B7").getValue() || "").trim();
  var checkUrl = String(sheet.getRange("C7").getValue() || "").trim();
  if (!checkBrand || !checkName || !checkUrl) {
    throw new Error("writeStoreMasterLayout_: A7/B7/C7 empty after write");
  }

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 280);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 280);
  sheet.setColumnWidth(7, 90);
  sheet.setColumnWidth(8, 90);
  sheet.setColumnWidth(9, 180);
  sheet.setColumnWidth(10, 200);
}

/** 既存シートのデータ行背景色だけ外す（中身は触らない） */
function clearStoreDataRowColors() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("店舗データ");
  if (!sheet) {
    return { ok: false, error: "店舗データ sheet missing" };
  }
  var values = sheet.getDataRange().getValues();
  var headerIndex = findStoreHeaderRowIndex_(values);
  var startRow = headerIndex >= 0 ? headerIndex + 2 : 2; // 1-based sheet row after header
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 10);
  if (lastRow < startRow) {
    return { ok: true, cleared: 0 };
  }
  sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).setBackground(null);
  sheet.clearConditionalFormatRules();
  return { ok: true, cleared: lastRow - startRow + 1, startRow: startRow };
}

/**
 * 検証ルール等が残った旧シートを捨て、新規シートに差し替える。
 */
function replaceStoreMasterSheet_(ss, rows) {
  var tempName = "_店舗データ_rebuild_tmp";
  var existingTemp = ss.getSheetByName(tempName);
  if (existingTemp) {
    ss.deleteSheet(existingTemp);
  }

  var neu = ss.insertSheet(tempName);
  writeStoreMasterLayout_(neu, rows);

  var old = ss.getSheetByName("店舗データ");
  if (old) {
    var trashName = ("_店舗データ_old_" + Utilities.formatDate(new Date(), "Asia/Tokyo", "HHmmss")).slice(0, 90);
    old.setName(trashName);
    try {
      ss.deleteSheet(old);
    } catch (eDel) {
      try {
        old.hideSheet();
      } catch (eHide) {}
    }
  }

  neu.setName("店舗データ");
  try {
    ss.setActiveSheet(neu);
    ss.moveActiveSheet(1);
  } catch (eMove) {}
}

function paintBrandRows_(sheet, rowNumbers, color) {
  if (!rowNumbers || !rowNumbers.length) return;
  for (var i = 0; i < rowNumbers.length; i++) {
    sheet.getRange("A" + rowNumbers[i] + ":J" + rowNumbers[i]).setBackground(color);
  }
}

function normalizeStoreBrandLabel_(value) {
  var raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!raw) return "";
  if (raw === "FIT365" || raw.indexOf("FIT365") === 0 || raw.indexOf("フィット365") >= 0) {
    return "FIT365";
  }
  if (raw === "YOGA" || raw.indexOf("YOGA") >= 0 || raw.indexOf("ヨガ") >= 0) {
    return "YOGA";
  }
  if (raw === "JOYFIT" || raw.indexOf("JOYFIT") === 0 || raw.indexOf("ジョイフィット") >= 0) {
    return "JOYFIT";
  }
  return "";
}

function detectStoreBrandLabelFromName_(storeName) {
  var name = String(storeName || "");
  var normalized = name.replace(/\s+/g, "").toLowerCase();
  if (
    (normalized.indexOf("yoga") >= 0 || normalized.indexOf("ヨガ") >= 0) &&
    (normalized.indexOf("ひばりが丘") >= 0 || normalized.indexOf("ひばりヶ丘") >= 0)
  ) {
    return "YOGA";
  }
  if (/fit365/i.test(name)) {
    return "FIT365";
  }
  return "JOYFIT";
}

function brandToApi_(label) {
  if (label === "FIT365") return "fit365";
  if (label === "YOGA") return "yoga";
  return "joyfit";
}

function debugStoreSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("店舗データ");
  if (!sheet) {
    return { ok: false, error: "missing" };
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var a1 = sheet.getRange(1, 1).getValue();
  var a6 = sheet.getRange(6, 1).getValue();
  var a7 = sheet.getRange(7, 1).getValue();
  var b7 = sheet.getRange(7, 2).getValue();
  var j7 = sheet.getRange(7, 10).getValue();
  var values = sheet.getDataRange().getValues();
  var headerIndex = findStoreHeaderRowIndex_(values);
  var sample = [];
  for (var i = 0; i < Math.min(values.length, 12); i++) {
    sample.push({
      row: i + 1,
      a: String(values[i][0] || ""),
      b: String(values[i][1] || "").slice(0, 40),
      j: String(values[i][9] || ""),
    });
  }
  return {
    ok: true,
    lastRow: lastRow,
    lastCol: lastCol,
    a1: String(a1 || ""),
    a6: String(a6 || ""),
    a7: String(a7 || ""),
    b7: String(b7 || "").slice(0, 60),
    j7: String(j7 || ""),
    headerIndex: headerIndex,
    readCount: readStoreRows().length,
    sample: sample,
  };
}

function isHeaderRow(cellA) {
  if (!cellA) {
    return false;
  }
  var t = String(cellA).trim();
  return t === "店舗名" || t === "名前" || t.indexOf("店舗名") === 0;
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
  if (!lock.tryLock(2000)) {
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

    if (submissionId) {
      recordSurveySubmissionId(submissionId, storeId, memberCode);
    }

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
  try {
    PropertiesService.getScriptProperties().setProperty(surveySheetCacheKey_(storeId), sheetName);
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
  try {
    var propName = PropertiesService.getScriptProperties().getProperty(surveySheetCacheKey_(storeId));
    if (propName) {
      var propSheet = ss.getSheetByName(propName);
      if (propSheet) {
        return propSheet;
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
