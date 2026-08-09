"use server";

import { getStoresGasUrl, parseReviewRegion, type ReviewRegion } from "@/lib/region";
import {
  fetchCheckRespondent,
  type CheckSurveyRespondentResult,
} from "@/lib/survey-respondent-check";

export type { CheckSurveyRespondentResult };

export async function checkSurveyRespondent(input: {
  memberCode: string;
  region?: ReviewRegion | string;
}): Promise<CheckSurveyRespondentResult> {
  const gasUrl = getStoresGasUrl(parseReviewRegion(input.region));
  if (!gasUrl) {
    return { ok: false, error: "ただいま確認をお受けできません。" };
  }

  return fetchCheckRespondent(gasUrl, input.memberCode);
}
