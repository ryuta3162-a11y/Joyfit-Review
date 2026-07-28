/** 店内POP・口コミ誘導で案内する固定特典文言（ブランド共通の旧表記） */
export const ENJOY_POINT_REWARD_LABEL = "エンジョイポイント500ポイント付与" as const;

/** トップ・店舗選択ページなど店舗未確定の画面で出すバッジ文言 */
export const SHARED_REWARD_BADGE_LABEL =
  "アンケート回答特典：エンジョイポイント / ベアレージポイント 500P付与";

export { STORE_REWARD_VARIES_NOTE } from "@/lib/store-reward";

/** 口コミ画面：最終ボタン文言 */
export const REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL = "Google口コミページへ移動する";

/** 完了画面：口コミページを開き直すボタン */
export const REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL = "Google口コミページを開く";

/** 特典はアンケート回答に紐づく旨（Google投稿とは切り離して案内） */
export const SURVEY_REWARD_GRANT_NOTE = "特典はアンケート回答をもって付与されます。";

/** 高評価アンケート完了画面 */
export const SURVEY_COMPLETION_THANK_YOU = "ご協力ありがとうございます";
export const SURVEY_COMPLETION_REWARD_NOTE = SURVEY_REWARD_GRANT_NOTE;
export const SURVEY_COMPLETION_POINT_PENDING_NOTE =
  "ポイント付与までには一定のお時間をいただく場合がございます。今しばらくお待ちください。";

/** 完了画面の特典表示用（「アンケート回答特典：」などの接頭辞を除く） */
export function formatSurveyCompletionRewardLabel(rewardLabel: string): string {
  const trimmed = rewardLabel.trim();
  const withoutPrefix = trimmed.replace(/^アンケート回答特典[：:]\s*/, "");
  return withoutPrefix || trimmed;
}

/** Google口コミ投稿後の案内（2行表示用） */
export function getGooglePostSurveyCompletionLines(): [string, string] {
  return ["Google口コミページで投稿すると、", "アンケートは終了です。"];
}

export type GooglePostConsentKey = "rating" | "draft" | "reward";

export type GooglePostConsentStep = {
  key: GooglePostConsentKey;
  stepNumber: number;
  question: string;
  /** 2行で見せたいとき */
  questionLines?: [string, string];
  hint: string;
  affirmLabel: string;
};

/** 投稿前の3段階同意チェック用文言 */
export function getGooglePostConsentSteps(input: { rating: number }): GooglePostConsentStep[] {
  const completionLines = getGooglePostSurveyCompletionLines();

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
      question: completionLines.join(""),
      questionLines: completionLines,
      hint: SURVEY_REWARD_GRANT_NOTE,
      affirmLabel: "はい、理解しました",
    },
  ];
}

export const GOOGLE_POST_CONSENT_PANEL_TITLE = "投稿前の確認";
export const GOOGLE_POST_CONSENT_PANEL_SUBTITLE = "3項目を確認 → チェックをしてください";
export const GOOGLE_POST_CONSENT_PROGRESS_HINT =
  "すべての項目にチェックを入れると、ボタンが使えるようになります。";
