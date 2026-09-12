import type { StoreMasterRow } from "@/lib/store-master";

/** WEST スタッフ試験用。店頭QR・店舗一覧には出さない（id=kansai） */
export const WEST_SAMPLE_STORE_ID = "kansai";

export const WEST_SAMPLE_STORE_NAME = "JOYFIT24サンプル";

/**
 * 口コミURL未設定のため、動作確認用に EAST・経堂の投稿URLを仮置き。
 * 本番店舗のURLが決まり次第、WEST「店舗データ」B列を差し替える。
 */
export const WEST_SAMPLE_REVIEW_URL =
  "https://g.page/r/Cdo92khF2w03EAE/review";

export const WEST_SAMPLE_STORE: StoreMasterRow = {
  id: WEST_SAMPLE_STORE_ID,
  name: WEST_SAMPLE_STORE_NAME,
  searchText: "サンプル sample テスト kansai JOYFIT24",
  googleReviewUrl: WEST_SAMPLE_REVIEW_URL,
  feedbackEmail: "r-kusaka@okamoto-group.co.jp",
  address: "テスト用店舗（店頭QR・本番一覧には出しません）",
};

export function isWestSampleStoreId(storeId: string): boolean {
  return storeId.trim().toLowerCase() === WEST_SAMPLE_STORE_ID;
}
