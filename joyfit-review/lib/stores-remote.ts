import type { StoreMasterRow } from "@/lib/store-master";
import { STORES_FALLBACK } from "@/lib/store-master";
import { getStoresGasUrl, type ReviewRegion } from "@/lib/region";

/** GAS doGet の JSON モード用。ベース URL のみ設定されていても店舗一覧が取れるようにする */
function storesListRequestUrl(base: string): string {
  const trimmed = base.trim();
  try {
    const u = new URL(trimmed);
    if (u.searchParams.get("format")?.toLowerCase() === "json") return trimmed;
    u.searchParams.set("format", "json");
    return u.toString();
  } catch {
    const join = trimmed.includes("?") ? "&" : "?";
    return trimmed + join + "format=json";
  }
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (v === undefined || v === null || String(v).trim() === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
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
  const address = pickString(r, ["address", "住所", "storeAddress"]);
  const latitude = pickNumber(r, ["latitude", "lat", "緯度"]);
  const longitude = pickNumber(r, ["longitude", "lng", "lon", "経度"]);
  const rewardLabel = pickString(r, [
    "rewardLabel",
    "reward_label",
    "特典文言",
    "特典",
  ]);

  if (!name || !id) return null;

  return {
    id,
    name,
    searchText: searchText || [name, address].filter(Boolean).join(" "),
    googleReviewUrl,
    feedbackEmail,
    address,
    latitude,
    longitude,
    rewardLabel,
  };
}

function fallbackForRegion(region: ReviewRegion): StoreMasterRow[] {
  // WEST に EAST のサンプル店舗を絶対に混ぜない
  if (region === "west") return [];
  return STORES_FALLBACK;
}

/**
 * GAS Webアプリ（または任意のJSON配列URL）から店舗一覧を取得。
 * region で EAST / WEST の接続先を切り替える。
 */
export async function fetchStoresRemote(
  region: ReviewRegion = "east",
): Promise<StoreMasterRow[]> {
  const url = getStoresGasUrl(region);
  if (!url) {
    return fallbackForRegion(region);
  }

  try {
    const res = await fetch(storesListRequestUrl(url), {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return fallbackForRegion(region);
    }

    const json: unknown = await res.json();
    if (!Array.isArray(json)) {
      return fallbackForRegion(region);
    }

    const parsed = json
      .map((row) => normalizeRemoteRow(row))
      .filter((row): row is StoreMasterRow => row !== null);

    return parsed.length ? parsed : fallbackForRegion(region);
  } catch {
    return fallbackForRegion(region);
  }
}

export async function getStoreByIdRemote(
  id: string,
  region: ReviewRegion = "east",
): Promise<StoreMasterRow | undefined> {
  const stores = await fetchStoresRemote(region);
  return stores.find((store) => store.id === id);
}
