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
  "feeAdjusted",
  "sessionMinutes",
];

var HEADER_JA = [
  "回答日時",
  "店舗ID",
  "店舗名",
  "見学体験",
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
  "入会",
  "追加ご意見",
  "よかった点",
  "口コミ文面",
  "送信ID",
  "会員番号",
  "会費調整",
  "利用時間",
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
    if (action === "seedKyodoSample") {
      return outputJson(seedKyodoSampleRows());
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
    try {
      ss.deleteSheet(old);
    } catch (err) {}
  }

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheets: [kyodo.getName(), toda.getName()],
    todaHeaders: toda.getRange(2, 1, 1, toda.getLastColumn()).getValues()[0],
    kyodoHeaders: kyodo.getRange(2, 1, 1, kyodo.getLastColumn()).getValues()[0],
    todaLastCol: toda.getLastColumn(),
    kyodoLastCol: kyodo.getLastColumn(),
  };
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  dropHandledColumn_(sheet);
  ensureHeaders(sheet);
  return sheet;
}

function dropHandledColumn_(sheet) {
  try {
    sheet.showRows(1);
    sheet.showColumns(1, sheet.getMaxColumns());
  } catch (err) {}

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var en = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var ja = sheet.getLastRow() >= 2 ? sheet.getRange(2, 1, 1, lastCol).getValues()[0] : [];
  var toDelete = [];
  for (var i = 0; i < lastCol; i++) {
    var a = String(en[i] || "").trim().toLowerCase().replace(/\s/g, "");
    var b = String(ja[i] || "").trim().replace(/\s/g, "");
    if (
      a === "handled" ||
      b === "対応済み" ||
      b === "対応" ||
      b.indexOf("対応") === 0
    ) {
      toDelete.push(i + 1);
    }
  }

  var filter = sheet.getFilter();
  if (filter) filter.remove();
  for (var d = toDelete.length - 1; d >= 0; d--) {
    sheet.deleteColumn(toDelete[d]);
  }

  lastCol = Math.max(sheet.getLastColumn(), 1);
  if (lastCol > HEADER_EN.length) {
    sheet.deleteColumns(HEADER_EN.length + 1, lastCol - HEADER_EN.length);
  }
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
  var widths = [150, 90, 140, 90, 120, 120, 130, 180, 80, 90, 140, 180, 180, 140, 70, 120, 200, 220, 260, 220, 130, 140, 110];
  for (var c = 0; c < widths.length; c++) {
    sheet.setColumnWidth(c + 1, widths[c]);
  }
  if (colCount >= 22) {
    sheet.getRange(1, 21, 2, 2)
      .setBackground("#b45309")
      .setFontColor(COLOR.white)
      .setFontWeight("bold");
  }
  ensurePhoneColumnText_(sheet);
  applyStaffDropdowns_(sheet);
  try {
    sheet.hideRows(1);
  } catch (err) {}
  var maxCol = sheet.getMaxColumns();
  if (maxCol > colCount) {
    try {
      sheet.hideColumns(colCount + 1, maxCol - colCount);
    } catch (err3) {}
  }
  applyHeaderFilter_(sheet);
}

/** 電話番号は文字として保存し、先頭0を消さない */
function ensurePhoneColumnText_(sheet) {
  var last = Math.max(sheet.getMaxRows(), 3);
  sheet.getRange(3, 7, last - 2, 1).setNumberFormat("@");
}

function formatJpPhone_(value) {
  var digits = String(value == null ? "" : value).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.charAt(0) === "0") return digits;
  if (digits.length === 10 || digits.length === 9) return "0" + digits;
  return digits;
}

function toStaffVisit_(value) {
  var v = String(value || "").trim();
  if (v === "taiken" || v.indexOf("体験") >= 0) return "体験";
  if (v === "kengaku" || v.indexOf("見学") >= 0) return "見学";
  return v;
}

function toStaffJoin_(value) {
  var v = String(value || "").trim();
  if (!v) return "検討中";
  if (v.indexOf("本日入会") >= 0 || v === "即入") return "即入";
  if (v.indexOf("後日") >= 0) return "後日";
  if (v.indexOf("検討") >= 0) return "検討中";
  if (v.indexOf("入会しない") >= 0) return "入会しない";
  return v;
}

function applyStaffDropdowns_(sheet) {
  var last = Math.max(sheet.getMaxRows(), 3);
  var visitRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["見学", "体験"], true)
    .setAllowInvalid(true)
    .build();
  var joinRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["即入", "後日", "検討中", "入会しない"], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(3, 4, last - 2, 1).setDataValidation(visitRule);
  sheet.getRange(3, 16, last - 2, 1).setDataValidation(joinRule);
  sheet.getRange(3, 21, last - 2, 1).setNumberFormat("@");
}

/** 日本語ヘッダー（2行目）で見学/体験などを絞り込みできる */
function applyHeaderFilter_(sheet) {
  var lastRow = Math.max(sheet.getLastRow(), 3);
  var lastCol = HEADER_EN.length;
  var existing = sheet.getFilter();
  if (existing) existing.remove();
  sheet.getRange(2, 1, lastRow - 1, lastCol).createFilter();
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
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = getOrCreateSheet(ss, sheetName);
    styleSheet(sheet);
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return { ok: false, error: "server busy" };
  }

  try {
    if (submissionId && isDuplicate(ss, submissionId)) {
      return { ok: true, duplicate: true, sheetName: sheet.getName() };
    }

    var visitType = String(data.visitType || "").trim();
    var visitLabel = toStaffVisit_(visitType);
    var phone = formatJpPhone_(data.phone);
    var isKyodo = storeId === "kyodo";
    var university = String(data.university || "").trim();
    if (!isKyodo && !university) university = "学生ではない";
    var joinIntent = toStaffJoin_(data.joinIntent);

    var nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 7).setNumberFormat("@");
    sheet.getRange(nextRow, 1, 1, 20).setValues([[
      new Date(),
      storeId,
      storeName,
      visitLabel,
      String(data.fullName || "").trim(),
      String(data.furigana || "").trim(),
      phone,
      String(data.email || "").trim(),
      String(data.gender || "").trim(),
      String(data.age || data.ageRange || "").trim(),
      university,
      String(data.gymExperience || "").trim(),
      toArray(data.howFound).join(" / "),
      String(data.howFoundOther || "").trim(),
      rating,
      joinIntent,
      String(data.extraComment || data.freeComment || "").trim(),
      toArray(data.positives).join(" / "),
      String(data.generatedReview || "").trim(),
      submissionId,
    ]]);
    sheet.getRange(nextRow, 7).setNumberFormat("@").setValue(phone);
    sheet.getRange(nextRow, 23).setValue(String(data.sessionMinutes || "").trim());
    if (isKyodo) applyKyodoSheet_(sheet);
    try {
      applyHeaderFilter_(sheet);
    } catch (filterErr) {}

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

function applyKyodoSheet_(sheet) {
  try {
    sheet.getRange(2, 12).setValue("トレーニング歴");
  } catch (err) {}
  var hideCols = [6, 7, 8, 10, 11, 17];
  for (var i = 0; i < hideCols.length; i++) {
    try {
      sheet.hideColumns(hideCols[i]);
    } catch (err2) {}
  }
}

function hideTodaUnusedColumns_(sheet) {
  var hideCols = [2, 3, 14, 17, 18, 19, 20];
  for (var i = 0; i < hideCols.length; i++) {
    sheet.hideColumns(hideCols[i]);
  }
}

/**
 * 戸田タブへ偽名サンプル60件（3ヶ月）を入れる（既存の sample-toda- は消して入れ直す）
 */
function seedTodaSampleRows() {
  return seedClosingSample_("戸田_回答", "sample-toda-", "todaniizo", "FIT365 戸田新曽", "3652");
}

function seedKyodoSampleRows() {
  return seedClosingSample_("経堂_回答", "sample-kyodo-", "kyodo", "JOYFIT24経堂", "1304");
}

function seedClosingSample_(sheetName, idPrefix, storeId, storeName, memberPrefix) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, sheetName);
  ensureHeaders(sheet);
  styleSheet(sheet);
  hideTodaUnusedColumns_(sheet);

  var last = sheet.getLastRow();
  if (last >= 3) {
    var ids = sheet.getRange(3, 20, last - 2, 1).getValues();
    var keep = [];
    var rows = sheet.getRange(3, 1, last - 2, HEADER_EN.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (String(ids[i][0] || "").indexOf(idPrefix) !== 0) keep.push(rows[i]);
    }
    sheet.getRange(3, 1, last - 2, HEADER_EN.length).clearContent();
    if (keep.length) {
      sheet.getRange(3, 1, keep.length, HEADER_EN.length).setValues(keep);
    }
  }

  var samples = closingSampleRows_(storeId, storeName, idPrefix, memberPrefix);
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 7, samples.length, 1).setNumberFormat("@");
  sheet.getRange(startRow, 1, samples.length, HEADER_EN.length).setValues(samples);
  var phones = [];
  for (var p = 0; p < samples.length; p++) {
    phones.push([formatJpPhone_(samples[p][6])]);
  }
  sheet.getRange(startRow, 7, samples.length, 1).setNumberFormat("@").setValues(phones);
  var members = [];
  for (var m = 0; m < samples.length; m++) {
    members.push([String(samples[m][20] || "")]);
  }
  sheet.getRange(startRow, 21, samples.length, 1).setNumberFormat("@").setValues(members);
  applyStaffDropdowns_(sheet);
  applyHeaderFilter_(sheet);
  return { ok: true, added: samples.length, sheet: sheet.getName() };
}

function pickWeighted_(rng, items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) total += items[i][1];
  var r = rng() * total;
  for (var j = 0; j < items.length; j++) {
    r -= items[j][1];
    if (r <= 0) return items[j][0];
  }
  return items[items.length - 1][0];
}

function rng_(seed) {
  var s = seed % 2147483646;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function closingSampleRows_(storeId, storeName, idPrefix, memberPrefix) {
  var last = [
    ["佐藤", "サトウ", "sato"], ["鈴木", "スズキ", "suzuki"], ["高橋", "タカハシ", "takahashi"],
    ["田中", "タナカ", "tanaka"], ["伊藤", "イトウ", "ito"], ["渡辺", "ワタナベ", "watanabe"],
    ["山本", "ヤマモト", "yamamoto"], ["中村", "ナカムラ", "nakamura"], ["小林", "コバヤシ", "kobayashi"],
    ["加藤", "カトウ", "kato"], ["吉田", "ヨシダ", "yoshida"], ["山田", "ヤマダ", "yamada"],
    ["佐々木", "ササキ", "sasaki"], ["松本", "マツモト", "matsumoto"], ["井上", "イノウエ", "inoue"],
    ["木村", "キムラ", "kimura"], ["林", "ハヤシ", "hayashi"], ["斎藤", "サイトウ", "saito"],
    ["清水", "シミズ", "shimizu"], ["山口", "ヤマグチ", "yamaguchi"], ["森", "モリ", "mori"],
    ["池田", "イケダ", "ikeda"], ["橋本", "ハシモト", "hashimoto"], ["阿部", "アベ", "abe"],
    ["石川", "イシカワ", "ishikawa"], ["山下", "ヤマシタ", "yamashita"], ["中島", "ナカジマ", "nakajima"],
    ["石井", "イシイ", "ishii"], ["小川", "オガワ", "ogawa"], ["前田", "マエダ", "maeda"]
  ];
  var firstM = [
    ["蓮", "レン", "ren"], ["大輔", "ダイスケ", "daisuke"], ["翔", "ショウ", "sho"],
    ["海斗", "カイト", "kaito"], ["悠真", "ユウマ", "yuma"], ["颯太", "ソウタ", "sota"],
    ["直樹", "ナオキ", "naoki"], ["大和", "ヤマト", "yamato"], ["拓也", "タクヤ", "takuya"],
    ["健太", "ケンタ", "kenta"]
  ];
  var firstF = [
    ["咲", "サキ", "saki"], ["陽菜", "ヒナ", "hina"], ["結衣", "ユイ", "yui"],
    ["美月", "ミツキ", "mitsuki"], ["彩乃", "アヤノ", "ayano"], ["琴音", "コトネ", "kotone"],
    ["莉子", "リコ", "riko"], ["千尋", "チヒロ", "chihiro"], ["真央", "マオ", "mao"],
    ["優奈", "ユウナ", "yuna"]
  ];
  var schools = ["早稲田大学", "立教大学", "明治大学", "法政大学", "日本大学", "淑徳大学", "埼玉大学", "浦和高校", "戸田高校", "戸田東高校"];
  var months = [
    { m: 6, n: 16, visitKengaku: 0.42, found: [["チラシ", 5], ["SNS", 4], ["現地を見て", 3], ["知人・友人の紹介", 3], ["WEB広告", 1]], joinSoku: 0.18 },
    { m: 7, n: 26, visitKengaku: 0.18, found: [["SNS", 11], ["知人・友人の紹介", 6], ["WEB広告", 5], ["現地を見て", 3], ["チラシ", 1]], joinSoku: 0.38 },
    { m: 8, n: 18, visitKengaku: 0.33, found: [["SNS", 6], ["現地を見て", 5], ["知人・友人の紹介", 4], ["WEB広告", 2], ["チラシ", 1]], joinSoku: 0.22 }
  ];
  var rows = [];
  var i = 0;
  for (var mi = 0; mi < months.length; mi++) {
    var spec = months[mi];
    for (var k = 0; k < spec.n; k++) {
      var rng = rng_(7801 + i * 97);
      rng();
      rng();
      var gender = i % 21 === 7 ? "回答しない" : (i % 2 === 0 ? "男性" : "女性");
      var female = gender !== "男性";
      var ln = last[i % last.length];
      var fn = female ? firstF[i % firstF.length] : firstM[i % firstM.length];
      var age = ["10代", "20代", "30代", "40代", "50代", "20代", "60代", "30代", "70代以上", "40代", "20代", "10代"][i % 12];
      var isStudent = (age === "10代" || age === "20代") && i % 3 !== 0;
      var kengakuN = Math.round(spec.n * spec.visitKengaku);
      var visit = k < kengakuN ? "見学" : "体験";
      var join;
      if (visit === "体験") {
        var taikenI = k - kengakuN;
        var taikenN = spec.n - kengakuN;
        var sokuN = Math.max(1, Math.round(taikenN * spec.joinSoku));
        join = taikenI < sokuN ? "即入" : ["後日", "検討中", "入会しない"][taikenI % 3];
      } else {
        join = ["後日", "検討中", "入会しない"][k % 3];
      }
      var gym = pickWeighted_(rng, [
        ["初めて利用する", 5],
        ["1年以上のブランクあり", 3],
        ["現在も他のジムを利用", 2],
        ["数ヶ月以内に他店を利用", 2]
      ]);
      var fee = join === "即入" && i % 3 === 0 ? "済" : "";
      var day = 2 + Math.floor(rng() * 26);
      var hour = 10 + Math.floor(rng() * 10);
      var n = String(i + 1).padStart(2, "0");
      rows.push([
        new Date(2026, spec.m, day, hour, Math.floor(rng() * 50)),
        storeId,
        storeName,
        visit,
        ln[0] + " " + fn[0],
        ln[1] + " " + fn[1],
        "0901111" + String(2201 + i),
        fn[2] + "." + ln[2] + ".sample@example.com",
        gender,
        age,
        isStudent ? pickWeighted_(rng, schools.map(function (s, idx) { return [s, idx < 3 ? 3 : 1]; })) : "学生ではない",
        gym,
        pickWeighted_(rng, spec.found),
        "",
        pickWeighted_(rng, [[5, 6], [4, 3], [3, 1]]),
        join,
        "",
        "",
        "",
        idPrefix + n,
        memberPrefix + String(i + 1).padStart(6, "0"),
        fee,
      ]);
      i += 1;
    }
  }
  return rows;
}

