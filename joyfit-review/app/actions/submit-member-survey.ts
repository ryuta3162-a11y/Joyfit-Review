"use server";

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
};

export type SubmitMemberSurveyResult = { ok: true } | { ok: false; error: string };

function resolveRecipients(storeEmail: string, fallback: string): string {
  const a = storeEmail.trim();
  const b = fallback.trim();
  if (a && b) return a + "," + b;
  return a || b;
}

export async function submitMemberSurvey(
  input: SubmitMemberSurveyInput,
): Promise<SubmitMemberSurveyResult> {
  const gasUrl = process.env.STORES_JSON_URL?.trim();
  if (!gasUrl) {
    return { ok: false, error: "ただいま送信をお受けできません。" };
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

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
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
      }),
    });

    const text = await res.text();
    let json: { ok?: boolean; error?: string } = {};
    try {
      json = JSON.parse(text) as { ok?: boolean; error?: string };
    } catch {
      return { ok: false, error: "送信に失敗しました。しばらくしてから再度お試しください。" };
    }

    if (!res.ok || !json.ok) {
      return { ok: false, error: "送信に失敗しました。しばらくしてから再度お試しください。" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "送信に失敗しました。通信状況をご確認のうえ、再度お試しください。" };
  }
}
