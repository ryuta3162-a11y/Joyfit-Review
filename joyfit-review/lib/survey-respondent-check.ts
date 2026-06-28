export type CheckSurveyRespondentResult =
  | { ok: true; eligible: true }
  | { ok: true; eligible: false; matchedBy: "memberCode" }
  | { ok: false; error: string; gasOutdated?: boolean };

export function buildCheckRespondentUrl(gasUrl: string, memberCode: string): string {
  const base = gasUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    format: "json",
    action: "checkRespondent",
    memberCode,
  });
  return `${base}?${params.toString()}`;
}

/** GASウェブアプリのコールドスタートを先に済ませる（本番チェックのロジックは変えない） */
export function warmupRespondentCheckGas(gasUrl: string): void {
  const base = gasUrl.replace(/\/$/, "");
  void fetch(`${base}?format=json`, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
  }).catch(() => {
    // ウォームアップ失敗は本番チェックに影響させない
  });
}

export function parseCheckRespondentResponse(json: unknown): CheckSurveyRespondentResult | null {
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

export async function fetchCheckRespondent(
  gasUrl: string,
  memberCode: string,
  signal?: AbortSignal,
): Promise<CheckSurveyRespondentResult> {
  const code = memberCode.trim().replace(/\D/g, "").slice(0, 10);
  if (!/^\d{10}$/.test(code) || /^0{10}$/.test(code)) {
    return { ok: true, eligible: true };
  }

  try {
    const getRes = await fetch(buildCheckRespondentUrl(gasUrl, code), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal,
    });
    const getText = await getRes.text();
    let getJson: unknown = null;
    try {
      getJson = JSON.parse(getText) as unknown;
    } catch {
      getJson = null;
    }

    const getParsed = parseCheckRespondentResponse(getJson);
    if (getParsed) {
      return getParsed;
    }

    const postRes = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        action: "checkRespondent",
        memberCode: code,
      }),
      cache: "no-store",
      signal,
    });

    const postText = await postRes.text();
    let postJson: unknown = null;
    try {
      postJson = JSON.parse(postText) as unknown;
    } catch {
      return { ok: false, error: "確認に失敗しました。" };
    }

    const postParsed = parseCheckRespondentResponse(postJson);
    if (postParsed) {
      return postParsed;
    }

    return { ok: false, error: "GASが古いバージョンです", gasOutdated: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "確認を中断しました。" };
    }
    return { ok: false, error: "確認に失敗しました。" };
  }
}
