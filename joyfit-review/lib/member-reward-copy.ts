/** 店内POP・口コミ誘導で案内する固定特典文言（ブランド共通の旧表記） */
export const ENJOY_POINT_REWARD_LABEL = "エンジョイポイント500ポイント付与" as const;

/** トップ・店舗選択ページなど店舗未確定の画面で出すバッジ文言 */
export const SHARED_REWARD_BADGE_LABEL =
  "アンケート回答特典：エンジョイポイント / ベアレージポイント 500P付与";

export { STORE_REWARD_VARIES_NOTE } from "@/lib/store-reward";

/** 口コミ画面：最終ボタン文言 */
export const REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL = "Google口コミページへ移動する";

/** 特典ラベルから付与内容だけを取り出す（「アンケート回答特典：」を除く） */
export function getReviewRewardBenefitText(rewardLabel: string): string {
  const benefit = rewardLabel.replace(/^アンケート回答特典[：:]\s*/, "").trim();
  return benefit || "特典ポイント";
}

/** 特典付与の案内（2行表示用） */
export function getGooglePostRewardLines(rewardLabel: string): [string, string] {
  const benefit = getReviewRewardBenefitText(rewardLabel);
  return ["Google口コミページで投稿することで", `${benefit}が付与されます`];
}

export type GooglePostConsentKey = "rating" | "draft" | "reward";

export type GooglePostConsentStep = {
  key: GooglePostConsentKey;
  stepNumber: number;
  question: string;
  /** 2行で見せたいとき（特典案内など） */
  questionLines?: [string, string];
  hint: string;
  affirmLabel: string;
};

/** 投稿前の3段階同意チェック用文言 */
export function getGooglePostConsentSteps(input: {
  rating: number;
  rewardLabel: string;
}): GooglePostConsentStep[] {
  const rewardLines = getGooglePostRewardLines(input.rewardLabel);

  return [
    {
      key: "rating",
      stepNumber: 1,
      question: `口コミの評価は星${input.rating}で間違いありませんか？`,
      hint: "口コミページでも、同じ星数をタップして選択してください。",
      affirmLabel: `はい、星${input.rating}で間違いありません`,
    },
    {
      key: "draft",
      stepNumber: 2,
      question: "以下の文面で投稿します。お間違いないですか？",
      hint: "必要に応じて、上の編集欄で文面を変更できます。",
      affirmLabel: "はい、この文面で投稿します",
    },
    {
      key: "reward",
      stepNumber: 3,
      question: rewardLines.join(""),
      questionLines: rewardLines,
      hint: "投稿が完了すると、特典が付与されます。",
      affirmLabel: "はい、内容を確認しました",
    },
  ];
}

export const GOOGLE_POST_CONSENT_PANEL_TITLE = "投稿前の確認";
export const GOOGLE_POST_CONSENT_PANEL_SUBTITLE = "3項目を確認 → チェックをしてください";
export const GOOGLE_POST_CONSENT_PROGRESS_HINT =
  "すべての項目にチェックを入れると、ボタンが使えるようになります。";
