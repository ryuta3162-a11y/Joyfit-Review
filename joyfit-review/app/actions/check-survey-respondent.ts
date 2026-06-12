"use server";

import {
  fetchCheckRespondent,
  type CheckSurveyRespondentResult,
} from "@/lib/survey-respondent-check";

export type { CheckSurveyRespondentResult };

export async function checkSurveyRespondent(input: {
  memberCode: string;
}): Promise<CheckSurveyRespondentResult> {
  const gasUrl = process.env.STORES_JSON_URL?.trim();
  if (!gasUrl) {
    return { ok: false, error: "ただいま確認をお受けできません。" };
  }

  return fetchCheckRespondent(gasUrl, input.memberCode);
}
