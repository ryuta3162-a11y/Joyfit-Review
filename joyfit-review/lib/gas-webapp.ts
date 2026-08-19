/** お客さま向け。専門用語（GAS / JSON / 再デプロイ等）は出さない */
export const CUSTOMER_SAVE_FAILED =
  "保存できませんでした。通信の良い場所で、もう一度お試しください。";

export const CUSTOMER_SAVE_SLOW =
  "保存に時間がかかっています。画面を閉じず、もう一度お試しください。";

export const CUSTOMER_SEND_UNAVAILABLE = "ただいま送信をお受けできません。";

type GasJson = { ok?: boolean; error?: string; [key: string]: unknown };

export async function postJsonToGasWebApp(
  gasUrl: string,
  payload: unknown,
  timeoutMs: number,
): Promise<{ json: GasJson } | { timeout: true } | { failed: true }> {
  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      cache: "no-store",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    try {
      return { json: JSON.parse(text) as GasJson };
    } catch {
      return { failed: true };
    }
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return { timeout: true };
    }
    return { failed: true };
  }
}

export function storesGasPingUrl(gasUrl: string): string {
  const trimmed = gasUrl.trim();
  try {
    const u = new URL(trimmed);
    u.searchParams.set("action", "ping");
    return u.toString();
  } catch {
    const join = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${join}action=ping`;
  }
}
