/**
 * 見学体験後アンケート（JOYFIT24経堂 / FIT365戸田新曽）
 * スプレッドシート（2店舗共通）:
 *   https://docs.google.com/spreadsheets/d/1jkYhtkXaxqV5-BPpTkeR0HNm6NNXjA8gxC2-0LKKjnY/edit
 *
 * POST { action: "survey" | "todaClosingSurvey", ... }
 * GET  ?format=json
 * GET  ?action=ping
 */

var SPREADSHEET_ID = "1jkYhtkXaxqV5-BPpTkeR0HNm6NNXjA8gxC2-0LKKjnY";

var STORE_SHEETS = {
  kyodo: "経堂_回答",
  todaniizo: "戸田_回答",
  toda: "戸田_回答",
};

var HEADER_EN = [
  "timestamp",
  "storeId",
  "storeName",
  "visitType",
  "fullName",
  "furigana",
  "phone",
  "email",
  "gender",
  "age",
  "university",
  "gymExperience",
  "howFound",
  "howFoundOther",
  "rating",
  "joinIntent",
  "extraComment",
  "positives",
  "generatedReview",
  "submissionId",
  "memberCode",
  "handled",
  "feeAdjusted",
];

var HEADER_JA = [
  "回答日時",
  "店舗ID",
  "店舗名",
  "見学/体験",
  "お名前",
  "フリガナ",
  "電話番号",
  "メール",
  "性別",
  "年齢",
  "大学名",
  "ジム利用経験",
  "知ったきっかけ",
  "きっかけ（その他）",
  "星評価",
  "入会意向",
  "追加ご意見",
  "よかった点",
  "口コミ文面",
  "送信ID",
  "会員番号",
  "対応済み",
  "個別会費調整済み",
];

var COLOR = {
  primary: "#a5354b",
  primaryDark: "#862d3d",
  white: "#FFFFFF",
  ink: "#3F3F46",
};

function doGet(e) {
  var format = e && e.parameter ? String(e.parameter.format || "").toLowerCase() : "";
  var action = e && e.parameter ? String(e.parameter.action || "").trim() : "";
  if (action === "ping" || format === "json") {
    var ss = getSpreadsheet();
    return outputJson({
      ok: true,
      service: "closing-survey",
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      sheets: ["経堂_回答", "戸田_回答"],
      sheetStatus: [
        sheetPreview(ss, "経堂_回答"),
        sheetPreview(ss, "戸田_回答"),
      ],
    });
  }
  return HtmlService.createHtmlOutput(
    "<p>見学体験後アンケート API（経堂 / 戸田新曽）</p>",
  ).setTitle("見学体験後アンケート");
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return outputJson({ ok: false, error: "empty body" });
    }
    var data = JSON.parse(e.postData.contents);
    var action = String(data.action || "").trim();
    if (action === "survey" || action === "todaClosingSurvey") {
      return outputJson(saveSurveyResponse(data));
    }
    if (action === "setupSheet") {
      return outputJson(setupWorkbook());
    }
    if (action === "seedTodaSample") {
      return outputJson(seedTodaSampleRows());
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
  if (Object.prototype.toString.call(value) === "[object Array]") return value;
  return [value];
}

function sheetPreview(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { name: sheetName, lastRow: 0 };
  var last = sheet.getLastRow();
  var preview = null;
  if (last >= 3) {
    var vals = sheet.getRange(last, 1, 1, 5).getValues()[0];
    preview = {
      timestamp: vals[0],
      storeId: String(vals[1] || ""),
      storeName: String(vals[2] || ""),
      visitType: String(vals[3] || ""),
      fullName: String(vals[4] || ""),
    };
  }
  return { name: sheetName, lastRow: last, preview: preview };
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function sheetNameForStore(storeId) {
  var id = String(storeId || "").trim();
  return STORE_SHEETS[id] || "";
}

function setupWorkbook() {
  var ss = getSpreadsheet();
  var kyodo = getOrCreateSheet(ss, "経堂_回答");
  var toda = getOrCreateSheet(ss, "戸田_回答");
  styleSheet(kyodo);
  styleSheet(toda);

  var old = ss.getSheetByName("回答");
  if (old) {
    var last = old.getLastRow();
    if (last > 2) {
      var rows = old.getRange(3, 1, last - 2, HEADER_EN.length).getValues();
      toda.getRange(toda.getLastRow() + 1, 1, rows.length, HEADER_EN.length).setValues(rows);
    }
    try {
      ss.deleteSheet(old);
    } catch (err) {}
  }

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheets: [kyodo.getName(), toda.getName()],
  };
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  var colCount = HEADER_EN.length;
  sheet.getRange(1, 1, 1, colCount).setValues([HEADER_EN]);
  sheet.getRange(2, 1, 1, colCount).setValues([HEADER_JA]);
}

function styleSheet(sheet) {
  var colCount = HEADER_EN.length;
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(2);
  sheet.getRange(1, 1, 1, colCount)
    .setBackground(COLOR.primaryDark)
    .setFontColor(COLOR.white)
    .setFontWeight("bold");
  sheet.getRange(2, 1, 1, colCount)
    .setBackground(COLOR.primary)
    .setFontColor(COLOR.white)
    .setFontWeight("bold")
    .setWrap(true);
  sheet.setRowHeight(1, 28);
  sheet.setRowHeight(2, 36);
  sheet.setTabColor(COLOR.primary);
  var widths = [150, 90, 140, 90, 120, 120, 130, 180, 80, 90, 140, 180, 180, 140, 70, 160, 200, 220, 260, 220, 130, 90, 140];
  for (var c = 0; c < widths.length; c++) {
    sheet.setColumnWidth(c + 1, widths[c]);
  }
  if (colCount >= 23) {
    sheet.getRange(1, 21, 2, 3)
      .setBackground("#b45309")
      .setFontColor(COLOR.white)
      .setFontWeight("bold");
  }
}

function getDedupSheet(ss) {
  var sheet = ss.getSheetByName("_closing_dedup");
  if (!sheet) {
    sheet = ss.insertSheet("_closing_dedup");
    sheet.hideSheet();
    sheet.appendRow(["submissionId", "timestamp", "storeId"]);
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

function saveSurveyResponse(data) {
  var rating = Number(data.rating || data.googleRating || data.nps || 0);
  if (!rating) return { ok: false, error: "rating is required" };

  var storeId = String(data.storeId || "").trim();
  var storeName = String(data.storeName || "").trim();
  if (!storeId || !storeName) {
    return { ok: false, error: "store is required" };
  }

  var sheetName = sheetNameForStore(storeId);
  if (!sheetName) {
    return { ok: false, error: "unknown store" };
  }

  var submissionId = String(data.submissionId || "").trim();
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, sheetName);
  styleSheet(sheet);
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
    var visitLabel = visitType === "taiken" ? "無料体験" : visitType === "kengaku" ? "見学" : visitType;

    sheet.appendRow([
      new Date(),
      storeId,
      storeName,
      visitLabel,
      String(data.fullName || "").trim(),
      String(data.furigana || "").trim(),
      String(data.phone || "").trim(),
      String(data.email || "").trim(),
      String(data.gender || "").trim(),
      String(data.age || data.ageRange || "").trim(),
      String(data.university || "").trim(),
      String(data.gymExperience || "").trim(),
      String(data.howFound || "").trim(),
      String(data.howFoundOther || "").trim(),
      rating,
      String(data.joinIntent || "").trim(),
      String(data.extraComment || data.freeComment || "").trim(),
      toArray(data.positives).join(" / "),
      String(data.generatedReview || "").trim(),
      submissionId,
    ]);

    if (submissionId) {
      getDedupSheet(ss).appendRow([submissionId, new Date(), storeId]);
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

function hideTodaUnusedColumns_(sheet) {
  var hideCols = [2, 3, 14, 17, 18, 19, 20];
  for (var i = 0; i < hideCols.length; i++) {
    sheet.hideColumns(hideCols[i]);
  }
}

/**
 * 戸田タブへ偽名サンプル20件を入れる（既存の sample-toda- は消して入れ直す）
 */
function seedTodaSampleRows() {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, "戸田_回答");
  ensureHeaders(sheet);
  styleSheet(sheet);
  hideTodaUnusedColumns_(sheet);

  var last = sheet.getLastRow();
  if (last >= 3) {
    var ids = sheet.getRange(3, 20, last - 2, 1).getValues();
    var keep = [];
    var rows = sheet.getRange(3, 1, last - 2, HEADER_EN.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (String(ids[i][0] || "").indexOf("sample-toda-") !== 0) keep.push(rows[i]);
    }
    sheet.getRange(3, 1, last - 2, HEADER_EN.length).clearContent();
    if (keep.length) {
      sheet.getRange(3, 1, keep.length, HEADER_EN.length).setValues(keep);
    }
  }

  var samples = todaSampleRows_();
  sheet.getRange(sheet.getLastRow() + 1, 1, samples.length, HEADER_EN.length).setValues(samples);
  return { ok: true, added: samples.length, sheet: sheet.getName() };
}

function todaSampleRows_() {
  var storeId = "todaniizo";
  var storeName = "FIT365 戸田新曽";
  var people = [
    ["青木 蓮", "アオキ レン", "09011112201", "ren.aoki.sample@example.com", "男性", "20代", "早稲田大学", "初めて利用する", "SNS", "", 5, "無料体験", "本日入会する（会費1,000円OFF）", "3652001001", "済", "済"],
    ["加藤 咲", "カトウ サキ", "09011112202", "saki.kato.sample@example.com", "女性", "20代", "立教大学", "現在も他のジムを利用", "WEB広告", "", 5, "無料体験", "本日入会する（会費1,000円OFF）", "3652001002", "済", ""],
    ["中村 大輔", "ナカムラ ダイスケ", "09011112203", "daisuke.n.sample@example.com", "男性", "30代", "", "1年以上のブランクあり", "知人・友人の紹介", "", 4, "無料体験", "後日入会予定", "", "", ""],
    ["小林 陽菜", "コバヤシ ヒナ", "09011112204", "hina.kobayashi.sample@example.com", "女性", "10代", "浦和高校", "初めて利用する", "チラシ", "", 5, "無料体験", "検討中", "", "", ""],
    ["高橋 翔", "タカハシ ショウ", "09011112205", "sho.takahashi.sample@example.com", "男性", "40代", "", "現在も他のジムを利用", "現地を見て", "", 4, "見学", "", "", "済", ""],
    ["伊藤 結衣", "イトウ ユイ", "09011112206", "yui.ito.sample@example.com", "女性", "20代", "明治大学", "数ヶ月以内に他店を利用", "SNS", "", 5, "無料体験", "本日入会する（会費1,000円OFF）", "3652001006", "", ""],
    ["渡辺 海斗", "ワタナベ カイト", "09011112207", "kaito.w.sample@example.com", "男性", "20代", "", "初めて利用する", "WEB広告", "", 3, "見学", "", "", "", ""],
    ["山本 美月", "ヤマモト ミツキ", "09011112208", "mitsuki.y.sample@example.com", "女性", "30代", "", "1年以上のブランクあり", "知人・友人の紹介", "", 5, "無料体験", "本日入会する（会費1,000円OFF）", "3652001008", "済", "済"],
    ["松本 悠真", "マツモト ユウマ", "09011112209", "yuma.matsumoto.sample@example.com", "男性", "10代", "戸田高校", "初めて利用する", "チラシ", "", 4, "無料体験", "後日入会予定", "", "", ""],
    ["井上 彩乃", "イノウエ アヤノ", "09011112210", "ayano.inoue.sample@example.com", "女性", "40代", "", "現在も他のジムを利用", "現地を見て", "", 5, "見学", "", "", "済", ""],
    ["木村 颯太", "キムラ ソウタ", "09011112211", "sota.kimura.sample@example.com", "男性", "20代", "法政大学", "数ヶ月以内に他店を利用", "SNS", "", 5, "無料体験", "本日入会する（会費1,000円OFF）", "", "", ""],
    ["林 琴音", "ハヤシ コトネ", "09011112212", "kotone.hayashi.sample@example.com", "女性", "20代", "", "初めて利用する", "WEB広告", "", 4, "見学", "", "", "", ""],
    ["斎藤 直樹", "サイトウ ナオキ", "09011112213", "naoki.saito.sample@example.com", "男性", "50代", "", "1年以上のブランクあり", "知人・友人の紹介", "", 4, "無料体験", "入会しない", "", "済", ""],
    ["清水 莉子", "シミズ リコ", "09011112214", "rico.shimizu.sample@example.com", "女性", "30代", "", "現在も他のジムを利用", "SNS", "", 5, "無料体験", "本日入会する（会費1,000円OFF）", "3652001014", "済", ""],
    ["森 大和", "モリ ヤマト", "09011112215", "yamato.mori.sample@example.com", "男性", "20代", "日本大学", "初めて利用する", "現地を見て", "", 5, "無料体験", "検討中", "", "", ""],
    ["池田 千尋", "イケダ チヒロ", "09011112216", "chihiro.ikeda.sample@example.com", "女性", "40代", "", "数ヶ月以内に他店を利用", "チラシ", "", 3, "見学", "", "", "", ""],
    ["橋本 拓也", "ハシモト タクヤ", "09011112217", "takuya.hashimoto.sample@example.com", "男性", "30代", "", "現在も他のジムを利用", "WEB広告", "", 5, "無料体験", "本日入会する（会費1,000円OFF）", "3652001017", "済", "済"],
    ["石川 真央", "イシカワ マオ", "09011112218", "mao.ishikawa.sample@example.com", "女性", "20代", "淑徳大学", "初めて利用する", "SNS", "", 4, "無料体験", "後日入会予定", "", "", ""],
    ["前田 優奈", "マエダ ユウナ", "09011112219", "yuna.maeda.sample@example.com", "女性", "10代", "", "初めて利用する", "知人・友人の紹介", "", 5, "見学", "", "", "", ""],
    ["藤田 健太", "フジタ ケンタ", "09011112220", "kenta.fujita.sample@example.com", "男性", "30代", "", "1年以上のブランクあり", "現地を見て", "", 4, "無料体験", "本日入会する（会費1,000円OFF）", "3652001020", "", ""],
  ];

  var days = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 20];
  var hours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 11, 13];
  var rows = [];
  for (var i = 0; i < people.length; i++) {
    var p = people[i];
    var ts = new Date(2026, 8, days[i], hours[i], 15 + i);
    rows.push([
      ts,
      storeId,
      storeName,
      p[11],
      p[0],
      p[1],
      p[2],
      p[3],
      p[4],
      p[5],
      p[6],
      p[7],
      p[8],
      p[9],
      p[10],
      p[12],
      "",
      "",
      "",
      "sample-toda-" + String(i + 1).padStart(2, "0"),
      p[13],
      p[14],
      p[15],
    ]);
  }
  return rows;
}

