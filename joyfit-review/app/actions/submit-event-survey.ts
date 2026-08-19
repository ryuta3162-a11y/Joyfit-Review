"use server";

/** 催事専用スプレッドシートに紐づく GAS ウェブアプリ（ENV で上書き可） */
const DEFAULT_EVENT_SURVEY_GAS_URL =
  "https://script.google.com/macros/s/AKfycby5dFI0fhOWwNHWRWU-Ax-jQAnBANyoPaWix4Kr3s6uL1r6QXregJPAnvYB2H7-AfjOqg/exec";

export type SubmitEventSurveyInput = {
  eventId: string;
  eventName: string;
  rating: number;
  experience: string[];
  experienceOther: string;
  triggers: string[];
  triggerOther: string;
  instagramAccounts: string[];
  futureEvents: string[];
  futureEventOther: string;
  pilatesMinutes: string;
  yogaMinutes: string;
  concerns: string[];
  concernOther: string;
  interest: string;
  impression: string;
  fullName: string;
  age: string;
  email: string;
  address: string;
  generatedReview: string;
  submissionId: string;
};

export type SubmitEventSurveyResult = { ok: true } | { ok: false; error: string };

export async function submitEventSurvey(
  input: SubmitEventSurveyInput,
): Promise<SubmitEventSurveyResult> {
  const gasUrl =
    process.env.EVENT_SURVEY_GAS_URL?.trim() ||
    DEFAULT_EVENT_SURVEY_GAS_URL;
  if (!gasUrl) {
    return { ok: false, error: "ただいま送信をお受けできません。" };
  }

  if (!input.rating || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "評価（星）を選択してください。" };
  }

  if (!input.submissionId.trim()) {
    return { ok: false, error: "送信に失敗しました。ページを再読み込みして再度お試しください。" };
  }

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        action: "eventSurvey",
        eventId: input.eventId,
        eventName: input.eventName,
        rating: input.rating,
        experience: input.experience,
        experienceOther: input.experienceOther.trim(),
        triggers: input.triggers,
        triggerOther: input.triggerOther.trim(),
        instagramAccounts: input.instagramAccounts,
        futureEvents: input.futureEvents,
        futureEventOther: input.futureEventOther.trim(),
        pilatesMinutes: input.pilatesMinutes.trim(),
        yogaMinutes: input.yogaMinutes.trim(),
        concerns: input.concerns,
        concernOther: input.concernOther.trim(),
        interest: input.interest,
        impression: input.impression.trim(),
        fullName: input.fullName.trim(),
        age: input.age.trim(),
        email: input.email.trim(),
        address: input.address.trim(),
        generatedReview: input.generatedReview.trim(),
        submissionId: input.submissionId.trim(),
      }),
    });

    const text = await res.text();
    let json: { ok?: boolean; error?: string } = {};
    try {
      json = JSON.parse(text) as { ok?: boolean; error?: string };
    } catch {
      return {
        ok: false,
        error: "保存できませんでした。通信の良い場所で、もう一度お試しください。",
      };
    }

    if (!res.ok || !json.ok) {
      if (json.error === "rating is required") {
        return { ok: false, error: "評価（星）を選択してください。" };
      }
      return {
        ok: false,
        error: "保存できませんでした。通信の良い場所で、もう一度お試しください。",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "送信に失敗しました。通信状況をご確認のうえ、再度お試しください。" };
  }
}
