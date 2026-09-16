"use server";

const DEFAULT_TODA_CLOSING_GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4OAYFaaHqZ49P-HqxlW3gH13WX6Ro7A1vfk0lisiJu7oyjPKzCdxRuam2ilKMgtxQlw/exec";

export type SubmitTodaClosingSurveyInput = {
  visitType: "kengaku" | "taiken";
  fullName: string;
  furigana: string;
  phone: string;
  email: string;
  gender: string;
  age: string;
  university: string;
  visitedAt: string;
  gymExperience: string;
  howFound: string;
  howFoundOther: string;
  nps: number;
  npsReason: string;
  joinIntent: string;
  facilityComment: string;
  positives: string[];
  googleRating: number;
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
  if (!input.fullName.trim() || !input.furigana.trim() || !input.phone.trim()) {
    return { ok: false, error: "必須項目をご入力ください。" };
  }
  if (!input.nps || input.nps < 1 || input.nps > 10) {
    return { ok: false, error: "紹介したい度（1〜10）を選択してください。" };
  }

  const gasUrl =
    process.env.TODA_CLOSING_GAS_URL?.trim() || DEFAULT_TODA_CLOSING_GAS_URL;

  if (!gasUrl) {
    // 保存先がまだでも、クロージングの口コミ投稿は止めない
    return { ok: true, saved: false };
  }

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        action: "todaClosingSurvey",
        visitType: input.visitType,
        fullName: input.fullName.trim(),
        furigana: input.furigana.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        gender: input.gender.trim(),
        age: input.age.trim(),
        university: input.university.trim(),
        visitedAt: input.visitedAt.trim(),
        gymExperience: input.gymExperience.trim(),
        howFound: input.howFound.trim(),
        howFoundOther: input.howFoundOther.trim(),
        nps: input.nps,
        npsReason: input.npsReason.trim(),
        joinIntent: input.joinIntent.trim(),
        facilityComment: input.facilityComment.trim(),
        positives: input.positives,
        googleRating: input.googleRating,
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
      // 権限未許可などでもクロージングの口コミは止めない
      return { ok: true, saved: false };
    }
    return { ok: true, saved: true };
  } catch {
    return { ok: true, saved: false };
  }
}
