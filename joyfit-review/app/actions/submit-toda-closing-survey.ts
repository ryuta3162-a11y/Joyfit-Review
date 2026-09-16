"use server";

const DEFAULT_CLOSING_GAS_URL =
  "https://script.google.com/macros/s/AKfycbyjyfr1fCvYQjvuFhLbkINwo7KUk8MhNwYALvXjecJ-zM5J1z4TfHJ0YnLHAQcmB-ZS6A/exec";

export type SubmitTodaClosingSurveyInput = {
  storeId: string;
  storeName: string;
  visitType: "kengaku" | "taiken";
  fullName: string;
  furigana: string;
  phone: string;
  email: string;
  gender: string;
  age: string;
  university: string;
  gymExperience: string;
  howFound: string;
  howFoundOther: string;
  rating: number;
  joinIntent: string;
  extraComment: string;
  positives: string[];
  generatedReview: string;
  submissionId: string;
};

export type SubmitTodaClosingSurveyResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: string };

export async function submitTodaClosingSurvey(
  input: SubmitTodaClosingSurveyInput,
): Promise<SubmitTodaClosingSurveyResult> {
  if (!input.submissionId.trim()) {
    return {
      ok: false,
      error: "送信に失敗しました。ページを再読み込みして再度お試しください。",
    };
  }
  if (input.visitType !== "kengaku" && input.visitType !== "taiken") {
    return { ok: false, error: "見学か無料体験を選択してください。" };
  }
  if (!input.storeId.trim() || !input.storeName.trim()) {
    return { ok: false, error: "店舗を確認できませんでした。" };
  }
  if (!input.fullName.trim() || !input.furigana.trim() || !input.phone.trim()) {
    return { ok: false, error: "必須項目をご入力ください。" };
  }
  if (!input.rating || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "星評価を選択してください。" };
  }

  const gasUrl =
    process.env.TODA_CLOSING_GAS_URL?.trim() || DEFAULT_CLOSING_GAS_URL;

  if (!gasUrl) {
    return { ok: true, saved: false };
  }

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        action: "todaClosingSurvey",
        storeId: input.storeId.trim(),
        storeName: input.storeName.trim(),
        visitType: input.visitType,
        fullName: input.fullName.trim(),
        furigana: input.furigana.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        gender: input.gender.trim(),
        age: input.age.trim(),
        university: input.university.trim(),
        gymExperience: input.gymExperience.trim(),
        howFound: input.howFound.trim(),
        howFoundOther: input.howFoundOther.trim(),
        rating: input.rating,
        joinIntent: input.joinIntent.trim(),
        extraComment: input.extraComment.trim(),
        positives: input.positives,
        generatedReview: input.generatedReview.trim(),
        submissionId: input.submissionId.trim(),
      }),
    });

    const text = await res.text();
    let json: { ok?: boolean; error?: string } = {};
    try {
      json = JSON.parse(text) as { ok?: boolean; error?: string };
    } catch {
      return { ok: true, saved: false };
    }

    if (!res.ok || !json.ok) {
      return { ok: true, saved: false };
    }
    return { ok: true, saved: true };
  } catch {
    return { ok: true, saved: false };
  }
}
