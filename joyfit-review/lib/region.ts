/** 口コミサイトのエリア（店舗マスタ／回答保存先の分離キー） */
export type ReviewRegion = "east" | "west";

export const REVIEW_REGIONS = ["east", "west"] as const;

export function isReviewRegion(value: string): value is ReviewRegion {
  return value === "east" || value === "west";
}

export function parseReviewRegion(value: string | null | undefined): ReviewRegion {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  return v === "west" ? "west" : "east";
}

/** URL プレフィックス。EAST は従来どおりルート直下 */
export function regionBasePath(region: ReviewRegion): string {
  return region === "west" ? "/west" : "";
}

export function regionLabel(region: ReviewRegion): string {
  return region === "west" ? "WEST（関西・西日本）" : "EAST（関東など）";
}

/**
 * エリアごとの店舗 GAS ウェブアプリ URL。
 * EAST: STORES_JSON_URL（既存）
 * WEST: STORES_JSON_URL_WEST
 */
export function getStoresGasUrl(region: ReviewRegion = "east"): string | undefined {
  if (region === "west") {
    return process.env.STORES_JSON_URL_WEST?.trim() || undefined;
  }
  return process.env.STORES_JSON_URL?.trim() || undefined;
}
