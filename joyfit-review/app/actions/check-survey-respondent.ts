"use server";

export type CheckSurveyRespondentResult =
  | { ok: true; eligible: true }
  | { ok: true; eligible: false; matchedBy: "memberCode" }
  | { ok: false; error: string; gasOutdated?: boolean };

function buildCheckUrl(gasUrl: string, memberCode: string): string {
  const base = gasUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    format: "json",
    action: "checkRespondent",
    memberCode,
  });
  return `${base}?${params.toString()}`;
}

function parseCheckResponse(json: unknown): CheckSurveyRespondentResult | null {
  if (Array.isArray(json)) {
    return { ok: false, error: "GASが古いバージョンです", gasOutdated: true };
  }
  if (!json || typeof json !== "object") {
    return null;
  }

  const body = json as { ok?: boolean; eligible?: boolean; matchedBy?: string; error?: string };
  if (body.ok === true && body.eligible === false) {
    return { ok: true, eligible: false, matchedBy: "memberCode" };
  }
  if (body.ok === true) {
    return { ok: true, eligible: true };
  }
  if (body.ok === false) {
    return { ok: false, error: body.error ?? "確認に失敗しました。" };
  }
  return null;
}

export async function checkSurveyRespondent(input: {
  memberCode: string;
}): Promise<CheckSurveyRespondentResult> {
  const gasUrl = process.env.STORES_JSON_URL?.trim();
  if (!gasUrl) {
    return { ok: false, error: "ただいま確認をお受けできません。" };
  }

  const memberCode = input.memberCode.trim().replace(/\D/g, "").slice(0, 10);
  if (!/^\d{10}$/.test(memberCode) || /^0{10}$/.test(memberCode)) {
    return { ok: true, eligible: true };
  }

  try {
    const getRes = await fetch(buildCheckUrl(gasUrl, memberCode), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    const getText = await getRes.text();
    let getJson: unknown = null;
    try {
      getJson = JSON.parse(getText) as unknown;
    } catch {
      getJson = null;
    }

    const getParsed = parseCheckResponse(getJson);
    if (getParsed) {
      return getParsed;
    }

    const postRes = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        action: "checkRespondent",
        memberCode,
      }),
      cache: "no-store",
    });

    const postText = await postRes.text();
    let postJson: unknown = null;
    try {
      postJson = JSON.parse(postText) as unknown;
    } catch {
      return { ok: false, error: "確認に失敗しました。" };
    }

    const postParsed = parseCheckResponse(postJson);
    if (postParsed) {
      return postParsed;
    }

    return { ok: false, error: "GASが古いバージョンです", gasOutdated: true };
  } catch {
    return { ok: false, error: "確認に失敗しました。" };
  }
}
