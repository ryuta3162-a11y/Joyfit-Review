"use server";

function resolveRecipients(storeEmail: string, fallback: string): string {
  const a = storeEmail.trim();
  const b = fallback.trim();
  if (a && b) return a + "," + b;
  return a || b;
}

export type SubmitLowRatingResult = { ok: true } | { ok: false; error: string };

/**
 * 星3以下のご意見を GAS（MailApp）経由でメール送信する。
 * STORES_JSON_URL と同じウェブアプリに doPost を実装してあること。
 */
export async function submitLowRatingFeedback(input: {
  storeId: string;
  storeName: string;
  rating: number;
  message: string;
  storeFeedbackEmail: string;
}): Promise<SubmitLowRatingResult> {
  const gasUrl = process.env.STORES_JSON_URL?.trim();
  const defaultEmail = process.env.DEFAULT_LOW_RATING_EMAIL?.trim() ?? "";

  const to = resolveRecipients(input.storeFeedbackEmail, defaultEmail);
  if (!to || !to.includes("@")) {
    return {
      ok: false,
      error: "送信を完了できませんでした。お手数ですが店舗までご連絡ください。",
    };
  }

  if (!gasUrl) {
    return { ok: false, error: "ただいま送信をお受けできません。" };
  }

  const body = [
    "【JOYFIT 口コミアプリ】低評価フィードバック",
    "",
    "店舗名: " + input.storeName,
    "店舗ID: " + input.storeId,
    "評価: 星" + input.rating,
    "",
    "--- ご意見 ---",
    input.message.trim(),
    "",
    "（このメールはアプリから自動送信されています）",
  ].join("\n");

  const subject = "【JOYFIT】低評価フィードバック（" + input.storeName + "）";

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ to, subject, body }),
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
