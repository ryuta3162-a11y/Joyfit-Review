import { REVIEW_GEO_MAX_AGE_MS, REVIEW_GEO_STORAGE_KEY, type StoredReviewGeo } from "@/lib/review-geo-storage";

export type ReviewGeoCoords = {
  lat: number;
  lng: number;
};

export type ReviewGeoFailureReason =
  | "unsupported"
  | "permission-denied"
  | "unavailable"
  | "timeout"
  | "unknown";

export type ReviewGeoResult =
  | { ok: true; coords: ReviewGeoCoords }
  | { ok: false; reason: ReviewGeoFailureReason };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 25_000,
  /** 直近の測位結果を再利用（屋内・GPS弱い環境でのタイムアウトを減らす） */
  maximumAge: 5 * 60 * 1000,
};

function toFailureReason(error: GeolocationPositionError): ReviewGeoFailureReason {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "permission-denied";
    case error.POSITION_UNAVAILABLE:
      return "unavailable";
    case error.TIMEOUT:
      return "timeout";
    default:
      return "unknown";
  }
}

export function readStoredReviewGeo(): ReviewGeoCoords | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(REVIEW_GEO_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredReviewGeo>;
    const { lat, lng, t } = parsed;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      typeof t !== "number" ||
      Date.now() - t >= REVIEW_GEO_MAX_AGE_MS
    ) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}

export function saveReviewGeo(coords: ReviewGeoCoords): void {
  if (typeof window === "undefined") return;

  try {
    const payload: StoredReviewGeo = { ...coords, t: Date.now() };
    sessionStorage.setItem(REVIEW_GEO_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function acquireReviewGeo(): Promise<ReviewGeoResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        saveReviewGeo(coords);
        resolve({ ok: true, coords });
      },
      (error) => {
        resolve({ ok: false, reason: toFailureReason(error) });
      },
      GEO_OPTIONS,
    );
  });
}

export function reviewGeoFailureMessage(reason: ReviewGeoFailureReason): string {
  switch (reason) {
    case "unsupported":
      return "お使いのブラウザでは位置情報を利用できません。Safari や Chrome など別のブラウザでお試しください。";
    case "permission-denied":
      return "位置情報の許可が必要です。アドレスバー付近の鍵アイコン等から、当サイトへの位置情報を「許可」にしてください。";
    case "timeout":
      return "位置情報の取得がタイムアウトしました。電波の良い場所で再度お試しください。";
    case "unavailable":
      return "現在地を取得できませんでした。屋外または電波の良い場所で再度お試しください。";
    default:
      return "位置情報を取得できませんでした。しばらくしてから再度お試しください。";
  }
}
