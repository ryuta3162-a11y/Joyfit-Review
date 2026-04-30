/** 口コミフローで位置情報をセッション内に保持するキー（トップ→店舗選択の受け渡し用） */
export const REVIEW_GEO_STORAGE_KEY = "joyfit-review-geo";

/** 保存座標の有効時間（ミリ秒） */
export const REVIEW_GEO_MAX_AGE_MS = 15 * 60 * 1000;

export type StoredReviewGeo = {
  lat: number;
  lng: number;
  t: number;
};
