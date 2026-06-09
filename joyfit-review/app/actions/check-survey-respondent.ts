"use server";

export type CheckSurveyRespondentResult =
  | { ok: true; eligible: true }
  | { ok: true; eligible: false; matchedBy: "email" | "name" }
  | { ok: false; error: string };

export async function checkSurveyRespondent(input: {
  fullName: string;
  email: string;
}): Promise<CheckSurveyRespondentResult> {
  const gasUrl = process.env.STORES_JSON_URL?.trim();
  if (!gasUrl) {
    return { ok: false, error: "ただいま確認をお受けできません。" };
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim();
  if (fullName.length < 2 && !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: true, eligible: true };
  }

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        action: "checkRespondent",
        fullName,
        email,
      }),
      cache: "no-store",
    });

    const text = await res.text();
    let json: { ok?: boolean; eligible?: boolean; matchedBy?: string; error?: string } = {};
    try {
      json = JSON.parse(text) as typeof json;
    } catch {
      return { ok: false, error: "確認に失敗しました。" };
    }

    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error ?? "確認に失敗しました。" };
    }

    if (json.eligible === false) {
      const matchedBy = json.matchedBy === "email" ? "email" : "name";
      return { ok: true, eligible: false, matchedBy };
    }

    return { ok: true, eligible: true };
  } catch {
    return { ok: false, error: "確認に失敗しました。" };
  }
}
