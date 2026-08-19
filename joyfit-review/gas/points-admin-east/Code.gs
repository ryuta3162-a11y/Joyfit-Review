/**
 * EAST ポイント付与管理（社内専用）
 *
 * 会員向けの公開GASとは別プロジェクト。
 * データブック: 現行 EAST口コミ APP（会員回答の本番）
 * バックアップ用クローン先: DEST_SPREADSHEET_ID
 *
 * デプロイ: ウェブアプリ
 * - 実行: 自分
 * - アクセス: 岡本グループ内（DOMAIN）
 */

var SOURCE_SPREADSHEET_ID = "13_E8m3vQa_61hcoMAPb7XZTyVDVtQ9O7rkVDNtHQvRM";
var DEST_SPREADSHEET_ID = "1t4RHRXLoxxxqUZHTvFhqfnUn5jH8G_t2usBbGj_I3vM";
var CLONE_BATCH_SIZE = 12;

var POINT_GRANT_CHECK_COL = 22;
var POINT_GRANT_AT_COL = 23;
var POINT_GRANT_HEADER = "ポイント付与済";
var POINT_GRANT_AT_HEADER = "付与日時";

function getWorkbook() {
  return SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
}

function doGet() {
  var pointsTemplate = HtmlService.createTemplateFromFile("points");
  pointsTemplate.stores = readStoreRows();
  return pointsTemplate
    .evaluate()
    .setTitle("EAST /ENJOYポイント付与")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * エディタから実行。現行 EAST ブックから店舗データと回答_* をコピーする。
 * シート数が多い場合は、完了するまで繰り返し実行する。
 */
function cloneFromEastSurveyWorkbook() {
  var source = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  var dest = SpreadsheetApp.openById(DEST_SPREADSHEET_ID);
  try {
    dest.rename("EAST ポイント付与管理");
  } catch (e) {}

  var copied = [];
  var skipped = [];
  var remaining = 0;
  var budget = CLONE_BATCH_SIZE;

  remaining += copyNamedSheet_(source, dest, "店舗データ", copied, skipped, budget);
  budget = CLONE_BATCH_SIZE - copied.length;

  var sourceSheets = source.getSheets();
  for (var i = 0; i < sourceSheets.length; i++) {
    var sh = sourceSheets[i];
    var name = String(sh.getName() || "");
    if (name.indexOf("回答_") !== 0) {
      continue;
    }
    if (budget <= 0) {
      remaining += 1;
      continue;
    }
    remaining += copyNamedSheet_(source, dest, name, copied, skipped, 1);
    budget = CLONE_BATCH_SIZE - copied.length;
  }

  removeBlankDefaultSheets_(dest);

  return {
    ok: true,
    copiedCount: copied.length,
    copied: copied,
    skipped: skipped,
    remainingEstimate: remaining,
    done: remaining === 0,
    destUrl: dest.getUrl(),
    note:
      remaining > 0
        ? "未コピーのシートが残っています。cloneFromEastSurveyWorkbook をもう一度実行してください。"
        : "クローン完了。このブックでポイント管理を確認できます。",
  };
}

function copyNamedSheet_(source, dest, name, copied, skipped, budget) {
  if (budget <= 0) {
    return 1;
  }
  var src = source.getSheetByName(name);
  if (!src) {
    skipped.push(name + "（元に無し）");
    return 0;
  }
  var existing = dest.getSheetByName(name);
  if (existing) {
    skipped.push(name + "（先に既存）");
    return 0;
  }
  var clone = src.copyTo(dest);
  clone.setName(name);
  copied.push(name);
  return 0;
}

function removeBlankDefaultSheets_(ss) {
  var sheets = ss.getSheets();
  if (sheets.length <= 1) {
    return;
  }
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    var name = String(sh.getName() || "");
    if (name !== "シート1" && name !== "Sheet1") {
      continue;
    }
    try {
      ss.deleteSheet(sh);
    } catch (e) {}
  }
}

function readStoreRows() {
  var ss = getWorkbook();
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
    if (!name) {
      continue;
    }
    var googleReviewUrl = String(row[1] || "").trim();
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
  return cellA.indexOf("店舗") !== -1 || cellA === "名前" || cellA === "店舗名";
}

function defaultSearchText(name, id, address) {
  return [name, id, address].filter(Boolean).join(" ");
}

function parseCoordinate(raw) {
  var text = String(raw == null ? "" : raw).trim();
  if (!text) return null;
  var n = Number(text);
  if (!isFinite(n)) return null;
  return n;
}

function normalizeMemberCode(value) {
  var mc = String(value || "")
    .trim()
    .replace(/\D/g, "");
  if (!/^\d{10}$/.test(mc) || /^0{10}$/.test(mc)) {
    return "";
  }
  return mc;
}

function safeSheetName(value) {
  return String(value || "unknown")
    .replace(/[\\\/\?\*\[\]:]/g, "_")
    .trim()
    .slice(0, 40);
}

function getPointGrantStoresForWeb() {
  var stores = readStoreRows();
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
      var grantedAt = granted && grantedAtRaw ? formatPointGrantDate(grantedAtRaw) : "";
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
    var sheet = getWorkbook().getSheetByName(String(sheetName || ""));
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
    var sheet = getWorkbook().getSheetByName(String(sheetName || ""));
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
    var grantedAt = granted && grantedAtRaw ? formatPointGrantDate(grantedAtRaw) : "";

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
  var sid = String(storeId || "")
    .trim()
    .toLowerCase();
  if (!sid) {
    return null;
  }
  var ss = getWorkbook();
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
    var expected = ("回答_" + safeSheetName(stores[i].name) + "_" + safeSheetName(stores[i].id)).slice(
      0,
      90,
    );
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
  var numRows = lastRow - 1;
  var range = sheet.getRange(2, col, numRows, 1);
  try {
    range.insertCheckboxes();
  } catch (e) {}
}

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
