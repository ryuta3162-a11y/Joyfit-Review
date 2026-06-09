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
  /** 同一操作の再送・二重タップで重複保存しないためのID */
  submissionId: string;
};

export type SubmitMemberSurveyResult = { ok: true } | { ok: false; error: string };

function mapGasSurveyError(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const msg = raw.trim();
  if (msg === "invalid recipient") {
    return "送信設定（GAS）が古い可能性があります。管理者に「ウェブアプリの再デプロイ」を依頼してください。";
  }
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
    return "このお名前またはメールアドレスでは、すでにご回答いただいています。";
  }
  if (msg.includes("script.send_mail") || msg.includes("MailApp")) {
    return "メール送信の権限が未設定です。GASで authorizeMailOnce を実行し、再デプロイしてください。";
  }
  return null;
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
        error:
          "送信に失敗しました（サーバー応答が不正です）。GASの再デプロイと STORES_JSON_URL をご確認ください。",
      };
    }

    if (!res.ok || !json.ok) {
      const mapped = mapGasSurveyError(json.error);
      return {
        ok: false,
        error:
          mapped ??
          `送信に失敗しました。${json.error ? `（${json.error}）` : ""} しばらくしてから再度お試しください。`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "送信に失敗しました。通信状況をご確認のうえ、再度お試しください。" };
  }
}
