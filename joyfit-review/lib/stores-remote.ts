import type { StoreMasterRow } from "@/lib/store-master";
import { STORES_FALLBACK } from "@/lib/store-master";

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

function normalizeRemoteRow(raw: unknown): StoreMasterRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = pickString(r, ["name", "店舗名", "storeName"]);
  const googleReviewUrl = pickString(r, ["googleReviewUrl", "google_review_url", "reviewUrl", "レビューURL"]);
  const id = pickString(r, ["id", "storeId", "店舗ID"]);
  const searchText = pickString(r, ["searchText", "search_text", "検索用", "検索用テキスト"]);
  const feedbackEmail = pickString(r, [
    "feedbackEmail",
    "feedback_email",
    "低評価通知メール",
    "通知メール",
  ]);

  if (!name || !googleReviewUrl || !id) return null;

  return {
    id,
    name,
    searchText: searchText || name,
    googleReviewUrl,
    feedbackEmail,
  };
}

/**
 * GAS Webアプリ（または任意のJSON配列URL）から店舗一覧を取得。
 * 失敗時はフォールバック。
 */
export async function fetchStoresRemote(): Promise<StoreMasterRow[]> {
  const url = process.env.STORES_JSON_URL?.trim();
  if (!url) {
    return STORES_FALLBACK;
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return STORES_FALLBACK;
    }

    const json: unknown = await res.json();
    if (!Array.isArray(json)) {
      return STORES_FALLBACK;
    }

    const parsed = json
      .map((row) => normalizeRemoteRow(row))
      .filter((row): row is StoreMasterRow => row !== null);

    return parsed.length ? parsed : STORES_FALLBACK;
  } catch {
    return STORES_FALLBACK;
  }
}

export async function getStoreByIdRemote(id: string): Promise<StoreMasterRow | undefined> {
  const stores = await fetchStoresRemote();
  return stores.find((store) => store.id === id);
}
