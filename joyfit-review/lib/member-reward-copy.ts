/** 店内POP・口コミ誘導で案内する固定特典文言（ブランド共通の旧表記） */
export const ENJOY_POINT_REWARD_LABEL = "エンジョイポイント500ポイント付与" as const;

/** トップ・店舗選択ページなど店舗未確定の画面で出すバッジ文言 */
export const SHARED_REWARD_BADGE_LABEL =
  "アンケート回答特典：エンジョイポイント / ベアレージポイント 500P付与";

export { STORE_REWARD_VARIES_NOTE } from "@/lib/store-reward";

/** 口コミ画面：特典が付く条件（ヘッダー・完了画面用） */
export const REVIEW_REWARD_ON_GOOGLE_POST_NOTE =
  "Google口コミページへの投稿で特典が付与されます";

/** 口コミ画面：最終ボタン文言 */
export const REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL = "Google口コミページへ移動する";

/** 同意チェック前に読む手順（※なし・本文のみ） */
export function getReviewGooglePostInstructions(rating: number): string[] {
  return [
    `「${REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL}」をタップすると、文章が自動コピーされ口コミページへ移動します。`,
    `同じ星評価（星${rating}）をタップし、文章を貼り付けて投稿すれば完了です。`,
  ];
}

/** 特典ラベルから付与内容だけを取り出す（「アンケート回答特典：」を除く） */
export function getReviewRewardBenefitText(rewardLabel: string): string {
  const benefit = rewardLabel.replace(/^アンケート回答特典[：:]\s*/, "").trim();
  return benefit || "特典ポイント";
}

export type GooglePostConsentKey = "rating" | "draft" | "reward";

export type GooglePostConsentStep = {
  key: GooglePostConsentKey;
  stepNumber: number;
  question: string;
  hint: string;
  affirmLabel: string;
};

/** 投稿前の3段階同意チェック用文言 */
export function getGooglePostConsentSteps(input: {
  rating: number;
  rewardLabel: string;
}): GooglePostConsentStep[] {
  const benefit = getReviewRewardBenefitText(input.rewardLabel);

  return [
    {
      key: "rating",
      stepNumber: 1,
      question: `口コミの評価は星${input.rating}で間違いありませんか？`,
      hint: "Google口コミページでも、同じ星数をタップして選択してください。",
      affirmLabel: `はい、星${input.rating}で間違いありません`,
    },
    {
      key: "draft",
      stepNumber: 2,
      question: "以下の文面で投稿します。お間違いないですか？",
      hint: "上の編集欄で変更した内容が、そのまま投稿文面になります。",
      affirmLabel: "はい、この文面で投稿します",
    },
    {
      key: "reward",
      stepNumber: 3,
      question: `口コミページへ移動し投稿すると、${benefit}が付与されます。理解しましたか？`,
      hint: REVIEW_REWARD_ON_GOOGLE_POST_NOTE,
      affirmLabel: "はい、理解しました",
    },
  ];
}

export const GOOGLE_POST_CONSENT_PANEL_TITLE = "投稿前の確認";
export const GOOGLE_POST_CONSENT_PANEL_SUBTITLE =
  "Google口コミへ進む前に、以下の3項目をご確認ください。";
export const GOOGLE_POST_CONSENT_PROGRESS_HINT =
  "すべての項目にチェックを入れると、ボタンが使えるようになります。";
