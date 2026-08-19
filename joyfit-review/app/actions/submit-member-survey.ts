"use server";

import {
  CUSTOMER_SAVE_FAILED,
  CUSTOMER_SAVE_SLOW,
  CUSTOMER_SEND_UNAVAILABLE,
  postJsonToGasWebApp,
} from "@/lib/gas-webapp";
import { getStoresGasUrl, parseReviewRegion, type ReviewRegion } from "@/lib/region";

const GAS_SURVEY_TIMEOUT_MS = 20_000;

export type SubmitMemberSurveyInput = {
  storeId: string;
  storeName: string;
  rating: number;
  fullName: string;
  memberCode: string;
  gender: string;
  ageRange: string;
  email: string;
  visitDate: string;
  positives: string[];
  useScenes: string[];
  freeComment: string;
  generatedReview: string;
  storeFeedbackEmail: string;
  skipAutoMail?: boolean;
  /** 同一操作の再送・二重タップで重複保存しないためのID */
  submissionId: string;
  /** EAST / WEST。未指定時は EAST（既存互換） */
  region?: ReviewRegion | string;
};

export type SubmitMemberSurveyResult = { ok: true } | { ok: false; error: string };

function mapGasSurveyError(raw: string | undefined): string {
  const msg = raw?.trim() ?? "";
  if (msg === "memberCode must be 10-digit number") {
    return "会員番号は半角数字10桁で入力してください。";
  }
  if (msg === "memberCode must not be placeholder") {
    return "アプリに表示されている会員番号に置き換えてください。";
  }
  if (msg === "rating is required") {
    return "評価（星）を選択してください。";
  }
  if (msg === "already_answered") {
    return "すでに回答済みです。";
  }
  return CUSTOMER_SAVE_FAILED;
}

function resolveRecipients(storeEmail: string, fallback: string): string {
  const a = storeEmail.trim();
  const b = fallback.trim();
  if (a && b) return a + "," + b;
  return a || b;
}

export async function submitMemberSurvey(
  input: SubmitMemberSurveyInput,
): Promise<SubmitMemberSurveyResult> {
  const region = parseReviewRegion(input.region);
  const gasUrl = getStoresGasUrl(region);
  if (!gasUrl) {
    return { ok: false, error: CUSTOMER_SEND_UNAVAILABLE };
  }

  const mc = input.memberCode.trim();
  if (!/^\d{10}$/.test(mc)) {
    return { ok: false, error: "会員番号は半角数字10桁で入力してください。" };
  }
  if (/^0{10}$/.test(mc)) {
    return { ok: false, error: "アプリに表示されている会員番号に置き換えてください。" };
  }

  const defaultEmail = process.env.DEFAULT_LOW_RATING_EMAIL?.trim() ?? "";
  const to = resolveRecipients(input.storeFeedbackEmail, defaultEmail);

  const posted = await postJsonToGasWebApp(
    gasUrl,
    {
      action: "survey",
      to,
      storeId: input.storeId,
      storeName: input.storeName,
      rating: input.rating,
      fullName: input.fullName.trim(),
      memberCode: input.memberCode.trim(),
      gender: input.gender,
      ageRange: input.ageRange,
      email: input.email.trim(),
      visitDate: input.visitDate,
      positives: input.positives,
      useScenes: input.useScenes,
      freeComment: input.freeComment.trim(),
      generatedReview: input.generatedReview.trim(),
      skipAutoMail: Boolean(input.skipAutoMail),
      submissionId: input.submissionId.trim(),
    },
    GAS_SURVEY_TIMEOUT_MS,
  );

  if ("timeout" in posted) {
    return { ok: false, error: CUSTOMER_SAVE_SLOW };
  }
  if ("failed" in posted) {
    return { ok: false, error: CUSTOMER_SAVE_FAILED };
  }

  if (!posted.json.ok) {
    return { ok: false, error: mapGasSurveyError(posted.json.error) };
  }
  return { ok: true };
}
