"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Search, Store } from "lucide-react";

import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import { Input } from "@/components/ui/input";
import type { StoreMasterRow } from "@/lib/store-master";
import { REVIEW_GEO_MAX_AGE_MS, REVIEW_GEO_STORAGE_KEY } from "@/lib/review-geo-storage";

type Props = {
  stores: StoreMasterRow[];
};

type StoreWithDistance = {
  store: StoreMasterRow;
  distanceMeters?: number;
};

function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().trim();
}

function calcDistanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const phi1 = toRad(aLat);
  const phi2 = toRad(bLat);
  const dPhi = toRad(bLat - aLat);
  const dLambda = toRad(bLng - aLng);
  const h =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function storeSubtitle(store: StoreMasterRow) {
  if (/^row\d+$/i.test(store.id)) {
    return "タップして口コミ文の作成へ";
  }
  return `店舗ID: ${store.id}`;
}

type GeoPhase = "loading" | "ok" | "blocked" | "unsupported";

export function StorePicker({ stores }: Props) {
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoPhase, setGeoPhase] = useState<GeoPhase>("loading");
  const [nearestPromptDismissed, setNearestPromptDismissed] = useState(false);

  const acquireLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setUserLocation(null);
      setGeoPhase("unsupported");
      return;
    }
    setGeoPhase("loading");
    setUserLocation(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setGeoPhase("ok");
        setNearestPromptDismissed(false);
        try {
          sessionStorage.setItem(
            REVIEW_GEO_STORAGE_KEY,
            JSON.stringify({ ...loc, t: Date.now() }),
          );
        } catch {
          /* ignore */
        }
      },
      () => {
        setUserLocation(null);
        setGeoPhase("blocked");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REVIEW_GEO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown; t?: unknown };
        const lat = parsed.lat;
        const lng = parsed.lng;
        const t = parsed.t;
        if (
          typeof lat === "number" &&
          typeof lng === "number" &&
          typeof t === "number" &&
          Date.now() - t < REVIEW_GEO_MAX_AGE_MS
        ) {
          setUserLocation({ lat, lng });
          setGeoPhase("ok");
          return;
        }
      }
    } catch {
      /* fall through */
    }
    acquireLocation();
  }, [acquireLocation]);

  const filteredAndSorted = useMemo<StoreWithDistance[]>(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    const base = !tokens.length
      ? stores
      : stores.filter((store) => {
          const haystack = normalize(`${store.name} ${store.searchText}`);
          return tokens.every((token) => haystack.includes(token));
        });

    if (!userLocation) return base.map((store) => ({ store, distanceMeters: undefined }));

    return base
      .map((store) => {
        if (typeof store.latitude !== "number" || typeof store.longitude !== "number") {
          return { store, distanceMeters: undefined as number | undefined };
        }
        const distanceMeters = calcDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          store.latitude,
          store.longitude,
        );
        return { store, distanceMeters };
      })
      .sort((a, b) => {
        if (a.distanceMeters === undefined && b.distanceMeters === undefined) return 0;
        if (a.distanceMeters === undefined) return 1;
        if (b.distanceMeters === undefined) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [query, stores, userLocation]);

  const nearestStore = useMemo(() => {
    if (geoPhase !== "ok" || query.trim() || nearestPromptDismissed) return null;
    const first = filteredAndSorted[0];
    if (!first?.store) return null;
    return first;
  }, [filteredAndSorted, geoPhase, nearestPromptDismissed, query]);

  const showStoreUi = geoPhase === "ok" && userLocation !== null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="joyfit-brand-header px-5 pb-6 pt-6 text-center text-white">
          <Link
            href="/"
            className="relative z-[1] mb-3 inline-block text-xs font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
          >
            ← トップに戻る
          </Link>
          <JoyfitHeaderLogo className="mb-1" />
          <h1 className="mt-3 text-lg font-bold leading-snug md:text-xl">
            口コミを投稿する店舗を
            <br />
            選択してください
          </h1>
        </div>

        {showStoreUi ? (
          <div className="border-t border-zinc-100 bg-card px-5 py-5">
            <p className="mb-3 text-sm font-bold text-zinc-900">他の店舗の口コミを投稿</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="店舗名を検索"
                className="h-12 rounded-xl border-zinc-200 bg-zinc-50 pl-10 text-base shadow-inner focus-visible:border-[color:var(--joyfit-red)]/40"
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              位置情報の許可が必須です。
              <br />
              現在地に基づき、店舗の候補が表示されます。
            </p>
          </div>
        ) : (
          <div className="border-t border-zinc-100 bg-card px-5 py-8">
            {geoPhase === "loading" && (
              <p className="text-center text-sm font-medium text-muted-foreground">
                位置情報を確認しています…
              </p>
            )}
            {geoPhase === "blocked" && (
              <div className="space-y-4 text-center">
                <p className="text-sm font-semibold leading-relaxed text-zinc-900">
                  位置情報が許可されていないため、店舗を表示できません。
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  口コミサポートをご利用になるには、ブラウザで当サイトへの位置情報の許可が必要です。
                </p>
                <button
                  type="button"
                  onClick={acquireLocation}
                  className="w-full rounded-xl bg-[color:var(--joyfit-red)] px-4 py-3 text-sm font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
                >
                  許可を確認して再試行
                </button>
                <Link
                  href="/"
                  className="inline-block text-xs font-medium text-[color:var(--joyfit-red)] underline-offset-4 hover:underline"
                >
                  トップに戻る
                </Link>
              </div>
            )}
            {geoPhase === "unsupported" && (
              <div className="space-y-3 text-center">
                <p className="text-sm font-semibold text-zinc-900">
                  お使いの環境では位置情報を利用できません。
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  スマートフォンのブラウザなど、位置情報に対応した端末からお試しください。
                </p>
                <Link
                  href="/"
                  className="inline-block text-xs font-medium text-[color:var(--joyfit-red)] underline-offset-4 hover:underline"
                >
                  トップに戻る
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {showStoreUi && nearestStore && (
        <div className="rounded-2xl border border-[color:var(--joyfit-red)]/30 bg-gradient-to-br from-[color:var(--joyfit-red)]/10 via-white to-white p-5 shadow-md">
          <p className="mt-2 text-base font-bold leading-snug text-zinc-900">
            口コミを投稿する店舗は「{nearestStore.store.name}」で合っていますか？
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/member/${nearestStore.store.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
            >
              口コミ投稿する
            </Link>
            <button
              type="button"
              onClick={() => setNearestPromptDismissed(true)}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              他の店舗を選ぶ
            </button>
          </div>
        </div>
      )}

      {showStoreUi && (!nearestStore || nearestPromptDismissed) && (
        <ul className="space-y-3">
          {filteredAndSorted.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-5 py-10 text-center text-sm text-muted-foreground">
              該当する店舗がありません。
              <br />
              別のキーワードでお試しください。
            </li>
          ) : (
            filteredAndSorted.map(({ store }) => (
              <li key={store.id}>
                <Link
                  href={`/member/${store.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-[color:var(--joyfit-red)]/40"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--joyfit-red)]/10 text-[color:var(--joyfit-red)] transition group-hover:bg-[color:var(--joyfit-red)]/16">
                    <Store className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-base font-bold text-foreground">{store.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {storeSubtitle(store)}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-[color:var(--joyfit-red)]" />
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
