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

var SURVEY_BRAND_SHEET_NAMES = {
  JOYFIT: "回答シート_JOYFIT",
  FIT365: "回答シート_FIT365",
  YOGA: "回答シート_YOGA",
};

function isBrandAnswerSheetName_(name) {
  return String(name || "").indexOf("回答シート_") === 0;
}

function isLegacyAnswerSheetName_(name) {
  var n = String(name || "");
  return n.indexOf("回答_") === 0 && !isBrandAnswerSheetName_(n);
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

function normalizeStoreBrandLabel_(value) {
  var raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!raw) return "";
  if (raw === "FIT365" || raw.indexOf("FIT365") === 0) return "FIT365";
  if (raw === "YOGA" || raw.indexOf("YOGA") >= 0) return "YOGA";
  if (raw === "JOYFIT" || raw.indexOf("JOYFIT") === 0) return "JOYFIT";
  return "";
}

function brandAnswerSheetName_(brandLabel) {
  var brand = normalizeStoreBrandLabel_(brandLabel) || "JOYFIT";
  return SURVEY_BRAND_SHEET_NAMES[brand] || SURVEY_BRAND_SHEET_NAMES.JOYFIT;
}

function getWorkbook() {
  return SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
}

function doGet() {
  var pointsTemplate = HtmlService.createTemplateFromFile("points");
  pointsTemplate.storesJson = storePickerJson_();
  pointsTemplate.answerStatsJson = answerStatsJson_();
  return pointsTemplate
    .evaluate()
    .setTitle("EAST /ENJOYポイント付与")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function answerStatsJson_() {
  return JSON.stringify(countAnswerDataStats_());
}

/**
 * ブランド回答シートから「回答がある店舗数」「回答行数」を集計。
 */
function countAnswerDataStats_() {
  var ss = getWorkbook();
  var registered = readStoreRows().length;
  var storeIds = {};
  var rowCount = 0;
  var byBrand = {
    JOYFIT: { storeIds: {}, rows: 0 },
    FIT365: { storeIds: {}, rows: 0 },
    YOGA: { storeIds: {}, rows: 0 },
  };
  var brands = ["JOYFIT", "FIT365", "YOGA"];

  for (var b = 0; b < brands.length; b++) {
    var brand = brands[b];
    var sheet = ss.getSheetByName(SURVEY_BRAND_SHEET_NAMES[brand]);
    if (!sheet) continue;
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) continue;
    var lastCol = Math.max(sheet.getLastColumn(), 6);
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var storeIdCol = 2;
    for (var h = 0; h < headers.length; h++) {
      if (String(headers[h] || "").trim() === "storeId") {
        storeIdCol = h + 1;
        break;
      }
    }
    var width = Math.max(storeIdCol, lastCol);
    var values = sheet.getRange(2, 1, lastRow - 1, width).getValues();
    for (var r = 0; r < values.length; r++) {
      var row = values[r];
      if (!answerRowHasData_(row)) continue;
      rowCount++;
      byBrand[brand].rows++;
      var sid = String(row[storeIdCol - 1] || "")
        .trim()
        .toLowerCase();
      if (!sid || !isLikelyStoreIdForStats_(sid)) continue;
      storeIds[sid] = true;
      byBrand[brand].storeIds[sid] = true;
    }
  }

  // 旧 回答_*（非表示）にだけ残っている店舗を加算（ブランドシート未反映の保険）
  addLegacyAnswerStoreCounts_(ss, storeIds, byBrand, function (brand, sid, rows) {
    if (rows <= 0) return;
    rowCount += rows;
    byBrand[brand].rows += rows;
    storeIds[sid] = true;
    byBrand[brand].storeIds[sid] = true;
  });

  function countKeys(obj) {
    var n = 0;
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) n++;
    }
    return n;
  }

  return {
    registeredStores: registered,
    storesWithAnswers: countKeys(storeIds),
    answerRows: rowCount,
    byBrand: {
      JOYFIT: { stores: countKeys(byBrand.JOYFIT.storeIds), rows: byBrand.JOYFIT.rows },
      FIT365: { stores: countKeys(byBrand.FIT365.storeIds), rows: byBrand.FIT365.rows },
      YOGA: { stores: countKeys(byBrand.YOGA.storeIds), rows: byBrand.YOGA.rows },
    },
  };
}

function isLikelyStoreIdForStats_(storeId) {
  var sid = String(storeId || "")
    .trim()
    .toLowerCase();
  if (!sid) return false;
  if (sid.indexOf("joyfit") >= 0 || sid.indexOf("fit365") >= 0 || sid.indexOf("yoga") >= 0) {
    return false;
  }
  return /^[a-z0-9][a-z0-9_-]{0,40}$/.test(sid);
}

function answerRowHasData_(row) {
  if (!row || !row.length) return false;
  var scan = Math.min(row.length, 16);
  for (var c = 0; c < scan; c++) {
    var v = row[c];
    if (v !== "" && v != null) return true;
  }
  return false;
}

function addLegacyAnswerStoreCounts_(ss, storeIds, byBrand, onLegacyRows) {
  var stores = readStoreRows();
  var brandById = {};
  for (var i = 0; i < stores.length; i++) {
    var sid = String(stores[i].id || "")
      .trim()
      .toLowerCase();
    if (!sid) continue;
    brandById[sid] = normalizeStoreBrandLabel_(stores[i].brandLabel || detectStoreBrandLabelFromName_(stores[i].name)) || "JOYFIT";
  }
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var name = String(sh.getName() || "");
    if (!isLegacyAnswerSheetName_(name)) continue;
    var m = name.match(/_([a-z0-9-]+)$/i);
    if (!m) continue;
    var sid2 = String(m[1]).toLowerCase();
    if (!isLikelyStoreIdForStats_(sid2)) continue;
    if (storeIds[sid2]) continue;
    var rows = Math.max(0, sh.getLastRow() - 1);
    if (rows <= 0) continue;
    var brand = brandById[sid2] || "JOYFIT";
    if (onLegacyRows) onLegacyRows(brand, sid2, rows);
  }
}

function storePickerJson_() {
  var stores = readStoreRows();
  var out = [];
  for (var i = 0; i < stores.length; i++) {
    out.push({
      id: stores[i].id,
      name: stores[i].name,
      brandLabel: stores[i].brandLabel || "",
    });
  }
  return JSON.stringify(out);
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

  var headerIndex = -1;
  var maxScan = Math.min(values.length, 30);
  for (var h = 0; h < maxScan; h++) {
    var rowH = values[h] || [];
    for (var c = 0; c < rowH.length; c++) {
      var cell = String(rowH[c] || "").trim();
      if (cell === "店舗名" || cell.indexOf("店舗名") === 0) {
        headerIndex = h;
        break;
      }
    }
    if (headerIndex >= 0) break;
  }

  var col = {
    brand: -1,
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
  if (headerIndex >= 0) {
    var headerRow = values[headerIndex];
    var idx = {};
    for (var i = 0; i < headerRow.length; i++) {
      var key = String(headerRow[i] || "").trim();
      if (key && idx[key] == null) idx[key] = i;
    }
    if (idx["ブランド"] != null) col.brand = idx["ブランド"];
    if (idx["店舗名"] != null) col.name = idx["店舗名"];
    if (idx["レビューURL"] != null) col.url = idx["レビューURL"];
    if (idx["低評価通知メール"] != null) col.email = idx["低評価通知メール"];
    if (idx["店舗ID"] != null) col.id = idx["店舗ID"];
    if (idx["住所"] != null) col.address = idx["住所"];
    if (idx["緯度"] != null) col.lat = idx["緯度"];
    if (idx["経度"] != null) col.lng = idx["経度"];
    if (idx["検索用"] != null) col.search = idx["検索用"];
    if (idx["特典文言"] != null) col.reward = idx["特典文言"];
  }

  var startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  var out = [];
  for (var r = startIndex; r < values.length; r++) {
    var row = values[r];
    var name = String(row[col.name] || "").trim();
    if (!name) continue;
    if (
      name === "JOYFIT" ||
      name === "FIT365" ||
      name === "YOGA" ||
      name === "合計" ||
      name === "ブランド" ||
      name === "店舗名" ||
      (name.indexOf("EAST") === 0 && name.indexOf("店舗") >= 0)
    ) {
      continue;
    }
    var googleReviewUrl = String(row[col.url] || "").trim();
    if (!googleReviewUrl) continue;

    var email = String(row[col.email] || "").trim();
    var id = String(row[col.id] || "").trim();
    var address = String(row[col.address] || "").trim();
    var searchText = String(row[col.search] || "").trim();
    var rewardLabel = String(row[col.reward] || "").trim();

    if (email && email.indexOf("@") < 0 && !id) {
      id = email;
      email = "";
    }
    if (!id) id = "row" + (r + 1);
    if (!searchText) searchText = defaultSearchText(name, id, address);

    out.push({
      id: id,
      name: name,
      searchText: searchText,
      googleReviewUrl: googleReviewUrl,
      feedbackEmail: email.indexOf("@") >= 0 ? email : "",
      address: address,
      latitude: parseCoordinate(row[col.lat]),
      longitude: parseCoordinate(row[col.lng]),
      rewardLabel: rewardLabel,
      brandLabel:
        col.brand >= 0
          ? normalizeStoreBrandLabel_(row[col.brand]) || detectStoreBrandLabelFromName_(name)
          : detectStoreBrandLabelFromName_(name),
    });
  }

  return out;
}

function isHeaderRow(cellA) {
  if (!cellA) {
    return false;
  }
  var t = String(cellA).trim();
  return t === "店舗名" || t === "名前" || t.indexOf("店舗名") === 0 || t === "ブランド";
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

function isStarRatingValue_(value) {
  var n = Number(String(value == null ? "" : value).trim());
  return n >= 1 && n <= 5 && String(Math.floor(n)) === String(n);
}

/**
 * 旧形式行（先頭の timestamp 無しで1列ずれ）を検知して補正する。
 * 典型: 星列に氏名、名前列に会員番号、日時列に店舗ID が入っている。
 */
function coerceSurveyRowFields_(row, cols) {
  var ts = cols.timestamp ? row[cols.timestamp - 1] : "";
  var storeId = cols.storeId ? String(row[cols.storeId - 1] || "").trim() : "";
  var storeName = cols.storeName ? String(row[cols.storeName - 1] || "").trim() : "";
  var ratingRaw = cols.rating ? row[cols.rating - 1] : "";
  var fullName = cols.fullName ? String(row[cols.fullName - 1] || "").trim() : "";
  var memberCode = cols.memberCode ? normalizeMemberCode(row[cols.memberCode - 1]) : "";
  var gender = cols.gender ? String(row[cols.gender - 1] || "").trim() : "";
  var ageRange = cols.ageRange ? String(row[cols.ageRange - 1] || "").trim() : "";
  var email = cols.email ? String(row[cols.email - 1] || "").trim() : "";
  var visitDate = cols.visitDate ? String(row[cols.visitDate - 1] || "").trim() : "";
  var positives = cols.positives ? String(row[cols.positives - 1] || "").trim() : "";
  var useScenes = cols.useScenes ? String(row[cols.useScenes - 1] || "").trim() : "";
  var freeComment = cols.freeComment ? String(row[cols.freeComment - 1] || "").trim() : "";
  var generatedReview = cols.generatedReview ? String(row[cols.generatedReview - 1] || "").trim() : "";
  var submissionId = cols.submissionId ? String(row[cols.submissionId - 1] || "").trim() : "";

  var ratingText = String(ratingRaw == null ? "" : ratingRaw).trim();
  var nameLooksLikeMemberCode = /^\d{10}$/.test(fullName);
  var ratingLooksLikeName = ratingText && !isStarRatingValue_(ratingText);
  var tsLooksLikeStoreId =
    !(ts instanceof Date) &&
    /^[a-z][a-z0-9_-]*$/i.test(String(ts || "").trim()) &&
    !/^\d{4}/.test(String(ts || "").trim());

  if (ratingLooksLikeName && nameLooksLikeMemberCode && !memberCode && tsLooksLikeStoreId) {
    var shiftedRating = isStarRatingValue_(storeName) ? String(Number(storeName)) : "";
    return {
      shifted: true,
      timestamp: "",
      timestampRaw: null,
      storeId: String(ts || "").trim(),
      storeName: storeId,
      rating: shiftedRating,
      fullName: ratingText,
      memberCode: fullName,
      gender: ageRange,
      ageRange: email,
      email: visitDate,
      visitDate: positives,
      positives: useScenes,
      useScenes: freeComment,
      freeComment: generatedReview,
      generatedReview: submissionId,
      submissionId: "",
    };
  }

  return {
    shifted: false,
    timestamp: formatPointGrantDate(ts),
    timestampRaw: ts,
    storeId: storeId,
    storeName: storeName,
    rating: ratingText,
    fullName: fullName,
    memberCode: memberCode,
    gender: gender,
    ageRange: ageRange,
    email: email,
    visitDate: visitDate,
    positives: positives,
    useScenes: useScenes,
    freeComment: freeComment,
    generatedReview: generatedReview,
    submissionId: submissionId,
  };
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
    out.push({
      id: stores[i].id,
      name: stores[i].name,
      hasSheet: true,
      sheetName: "",
    });
  }
  return out;
}

function getPointGrantRowsForWeb(storeId) {
  try {
    var sid = String(storeId || "")
      .trim()
      .toLowerCase();
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
      var fields = coerceSurveyRowFields_(row, cols);
      if (sid && fields.storeId && String(fields.storeId).trim().toLowerCase() !== sid) {
        continue;
      }
      if (!fields.fullName && !fields.memberCode && !fields.timestamp && !fields.timestampRaw) {
        continue;
      }
      var granted = row[POINT_GRANT_CHECK_COL - 1] === true;
      var grantedAtRaw = row[POINT_GRANT_AT_COL - 1];
      var grantedAt = granted && grantedAtRaw ? formatPointGrantDate(grantedAtRaw) : "";
      var tsRaw = fields.timestampRaw;
      rows.push({
        rowIndex: rowIndex,
        timestamp: fields.timestamp || (grantedAt ? grantedAt : ""),
        timestampSort: tsRaw instanceof Date ? tsRaw.getTime() : grantedAtRaw instanceof Date ? grantedAtRaw.getTime() : 0,
        fullName: fields.fullName,
        memberCode: fields.memberCode,
        rating: fields.rating,
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
    var fields = coerceSurveyRowFields_(values, cols);

    return {
      ok: true,
      detail: {
        rowIndex: row,
        granted: granted,
        grantedAt: grantedAt,
        timestamp: fields.timestamp || grantedAt || "",
        storeId: fields.storeId,
        storeName: fields.storeName,
        rating: fields.rating,
        fullName: fields.fullName,
        memberCode: fields.memberCode,
        gender: fields.gender,
        ageRange: fields.ageRange,
        email: fields.email,
        visitDate: fields.visitDate,
        positives: fields.positives,
        useScenes: fields.useScenes,
        freeComment: fields.freeComment,
        generatedReview: fields.generatedReview,
        submissionId: fields.submissionId,
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
  var stores = readStoreRows();
  var brand = "JOYFIT";
  var matched = null;
  for (var i = 0; i < stores.length; i++) {
    if (String(stores[i].id || "").trim().toLowerCase() === sid) {
      matched = stores[i];
      brand = stores[i].brandLabel || detectStoreBrandLabelFromName_(stores[i].name);
      break;
    }
  }
  var brandSheet = ss.getSheetByName(brandAnswerSheetName_(brand));
  if (brandSheet) {
    return brandSheet;
  }

  var sheets = ss.getSheets();
  var suffix = "_" + sid;
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var name = sh.getName();
    if (!isLegacyAnswerSheetName_(name)) {
      continue;
    }
    if (name.toLowerCase().slice(-suffix.length) === suffix) {
      return sh;
    }
  }
  if (matched) {
    var expected = ("回答_" + safeSheetName(matched.name) + "_" + safeSheetName(matched.id)).slice(0, 90);
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
