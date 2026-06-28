/** 店内POP・口コミ誘導で案内する固定特典文言（ブランド共通の旧表記） */
export const ENJOY_POINT_REWARD_LABEL = "エンジョイポイント500ポイント付与" as const;

/** トップ・店舗選択ページなど店舗未確定の画面で出すバッジ文言 */
export const SHARED_REWARD_BADGE_LABEL =
  "アンケート回答特典：エンジョイポイント / ベアレージポイント 500P付与";

export { STORE_REWARD_VARIES_NOTE } from "@/lib/store-reward";

/** 口コミ画面：特典が付く条件（ヘッダー・完了画面用） */
export const REVIEW_REWARD_ON_GOOGLE_POST_NOTE =
  "※ Google口コミページへの投稿で特典が付与されます";

/** 口コミ画面：投稿手順（「口コミを投稿する」ボタン直前） */
export const REVIEW_GOOGLE_POST_FLOW_NOTE = [
  "※ 「口コミを投稿する」をタップすると、文章が自動コピーされGoogle口コミページへ移動します。",
  "同じ星評価をタップし、文章を貼り付けて投稿すれば完了です。",
  REVIEW_REWARD_ON_GOOGLE_POST_NOTE,
] as const;
