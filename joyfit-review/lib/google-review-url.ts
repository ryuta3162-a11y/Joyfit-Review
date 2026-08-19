/** g.page の末尾 /review を補い、可能なら投稿フォームの正式URLへ寄せる */

function ensureGpageReviewPath(url: string): string {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)g\.page$/i.test(parsed.hostname)) return url;
    const trimmed = parsed.pathname.replace(/\/+$/, "");
    if (/^\/r\/[^/]+$/i.test(trimmed)) {
      parsed.pathname = `${trimmed}/review`;
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function toWriteReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

function placeIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("placeid");
  } catch {
    return null;
  }
}

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const resolvedCache = new Map<string, string>();

async function followReviewRedirects(startUrl: string): Promise<string> {
  let current = startUrl;
  for (let i = 0; i < 5; i += 1) {
    const placeId = placeIdFromUrl(current);
    if (placeId) return toWriteReviewUrl(placeId);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(current, {
        redirect: "manual",
        headers: { "User-Agent": IPHONE_UA },
        signal: controller.signal,
      });
      const location = res.headers.get("location");
      if (!location) return current;
      current = new URL(location, current).toString();
    } catch {
      return current;
    } finally {
      clearTimeout(timer);
    }
  }
  const placeId = placeIdFromUrl(current);
  return placeId ? toWriteReviewUrl(placeId) : current;
}

/**
 * スマホで g.page のまま開くとアドレスバーが暗号っぽく見えたり、
 * 店舗ページ止まりになることがあるため、投稿フォームURLへ解決する。
 */
export async function resolveGoogleWriteReviewUrl(input: string): Promise<string> {
  const raw = input.trim();
  if (!raw) return raw;

  const cached = resolvedCache.get(raw);
  if (cached) return cached;

  const existingPlaceId = placeIdFromUrl(raw);
  if (existingPlaceId) {
    const next = toWriteReviewUrl(existingPlaceId);
    resolvedCache.set(raw, next);
    return next;
  }

  const withReview = ensureGpageReviewPath(raw);
  if (!/g\.page\/r\//i.test(withReview)) {
    resolvedCache.set(raw, withReview);
    return withReview;
  }

  const next = await followReviewRedirects(withReview);
  resolvedCache.set(raw, next);
  return next;
}
