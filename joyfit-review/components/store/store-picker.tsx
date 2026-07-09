"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, MapPin, Search, Store } from "lucide-react";

import { memberFormCardClass, memberFormInputClass } from "@/components/member/member-form-styles";
import { Input } from "@/components/ui/input";
import { BRAND_THEMES, brandCssVars, type Brand } from "@/lib/brand";
import {
  acquireReviewGeo,
  readStoredReviewGeo,
  reviewGeoFailureMessage,
  type ReviewGeoFailureReason,
} from "@/lib/review-geo-client";
import type { StoreMasterRow } from "@/lib/store-master";

type Props = {
  stores: StoreMasterRow[];
  brand: Brand;
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

type GeoPhase = "loading" | "ok" | "needs-action" | "failed" | "unsupported";

export function StorePicker({ stores, brand }: Props) {
  const theme = BRAND_THEMES[brand];
  const brandVars = useMemo(() => brandCssVars(theme), [theme]);
  const memberHref = (storeId: string) => `/${brand}/member/${storeId}`;
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoPhase, setGeoPhase] = useState<GeoPhase>("loading");
  const [geoFailureReason, setGeoFailureReason] = useState<ReviewGeoFailureReason | null>(null);
  const [nearestPromptDismissed, setNearestPromptDismissed] = useState(false);
  const [manualSearch, setManualSearch] = useState(false);

  const applyCoords = useCallback((coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
    setGeoPhase("ok");
    setGeoFailureReason(null);
    setNearestPromptDismissed(false);
  }, []);

  const requestLocation = useCallback(async () => {
    setGeoPhase("loading");
    setGeoFailureReason(null);

    const result = await acquireReviewGeo();
    if (result.ok) {
      applyCoords(result.coords);
      return;
    }

    setUserLocation(null);
    if (result.reason === "unsupported") {
      setGeoPhase("unsupported");
      return;
    }

    setGeoFailureReason(result.reason);
    setGeoPhase("failed");
  }, [applyCoords]);

  useEffect(() => {
    const cached = readStoredReviewGeo();
    if (cached) {
      applyCoords(cached);
      return;
    }

    // iOS 等ではユーザー操作なしの自動取得が失敗しやすいため、初回はボタン操作を促す
    setGeoPhase("needs-action");
  }, [applyCoords]);

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

  const showStoreUi = manualSearch || (geoPhase === "ok" && userLocation !== null);
  const failureMessage = geoFailureReason ? reviewGeoFailureMessage(geoFailureReason) : null;

  const enterManualSearch = useCallback(() => {
    setManualSearch(true);
    setNearestPromptDismissed(true);
  }, []);

  return (
    <div className="space-y-4" data-brand={brand} style={brandVars}>
      <div className={memberFormCardClass}>
        <div className="joyfit-brand-header px-5 pb-6 pt-6 text-center text-white">
          <Link
            href={`/${brand}`}
            className="relative z-[1] mb-3 inline-block text-xs font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
          >
            ← トップに戻る
          </Link>
          <h1 className="relative z-[1] mt-2 text-lg font-bold leading-snug whitespace-nowrap md:text-xl">
            対象店舗を選択してください
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
                className={`${memberFormInputClass} h-12 pl-10`}
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {manualSearch ? (
                <>店舗名で検索して、投稿する店舗を選んでください。</>
              ) : (
                <>
                  現在地に基づき、お近くの店舗が優先して表示されます。
                  <br />
                  位置情報を許可しない場合は、下の「店舗名で検索する」から選べます。
                </>
              )}
            </p>
            {!manualSearch && (
              <button
                type="button"
                onClick={enterManualSearch}
                className="mt-3 text-xs font-medium text-[color:var(--joyfit-red)] underline-offset-4 hover:underline"
              >
                位置情報を使わず店舗名で検索する
              </button>
            )}
          </div>
        ) : (
          <div className="border-t border-zinc-100 bg-card px-5 py-8">
            {geoPhase === "loading" && (
              <p className="text-center text-sm font-medium text-muted-foreground">
                位置情報を確認しています…
              </p>
            )}
            {geoPhase === "needs-action" && (
              <div className="space-y-4 text-center">
                <p className="text-sm font-semibold leading-relaxed text-zinc-900">
                  現在地を取得して、お近くの店舗を表示します。
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  下のボタンをタップし、表示された位置情報の許可を選んでください。
                </p>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--joyfit-red)] px-4 py-3 text-sm font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
                >
                  <MapPin className="h-4 w-4" />
                  現在地を取得する
                </button>
                <button
                  type="button"
                  onClick={enterManualSearch}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  位置情報を使わず店舗名で検索する
                </button>
              </div>
            )}
            {geoPhase === "failed" && (
              <div className="space-y-4 text-center">
                <p className="text-sm font-semibold leading-relaxed text-zinc-900">
                  {failureMessage}
                </p>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="w-full rounded-xl bg-[color:var(--joyfit-red)] px-4 py-3 text-sm font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
                >
                  もう一度試す
                </button>
                <button
                  type="button"
                  onClick={enterManualSearch}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  位置情報を使わず店舗名で検索する
                </button>
                <Link
                  href={`/${brand}`}
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
                  店舗名で検索して、投稿する店舗を選んでください。
                </p>
                <button
                  type="button"
                  onClick={enterManualSearch}
                  className="w-full rounded-xl bg-[color:var(--joyfit-red)] px-4 py-3 text-sm font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
                >
                  店舗名で検索する
                </button>
                <Link
                  href={`/${brand}`}
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
              href={memberHref(nearestStore.store.id)}
              className="inline-flex items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
            >
              アンケートに進む
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
                  href={memberHref(store.id)}
                  className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-[color:var(--joyfit-red)]/40"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--joyfit-red)]/10 text-[color:var(--joyfit-red)] transition group-hover:bg-[color:var(--joyfit-red)]/16">
                    <Store className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-base font-bold text-foreground">{store.name}</span>
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
