"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, MapPin, Search, Store } from "lucide-react";

import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import { Input } from "@/components/ui/input";
import type { StoreMasterRow } from "@/lib/store-master";

type Props = {
  stores: StoreMasterRow[];
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

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function storeSubtitle(store: StoreMasterRow) {
  if (/^row\d+$/i.test(store.id)) {
    return "タップして口コミ文の作成へ";
  }
  return `店舗ID: ${store.id}`;
}

export function StorePicker({ stores }: Props) {
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "ok" | "blocked" | "unsupported">("idle");
  const [nearestPromptDismissed, setNearestPromptDismissed] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      () => setGeoStatus("blocked"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  const filteredAndSorted = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    const base = !tokens.length
      ? stores
      : stores.filter((store) => {
      const haystack = normalize(`${store.name} ${store.searchText}`);
      return tokens.every((token) => haystack.includes(token));
    });

    if (!userLocation) return base.map((store) => ({ store }));

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
    if (geoStatus !== "ok" || query.trim() || nearestPromptDismissed) return null;
    const first = filteredAndSorted[0];
    if (!first?.store) return null;
    return first;
  }, [filteredAndSorted, geoStatus, nearestPromptDismissed, query]);

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
          <p className="mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-white/90">
            店舗名・エリア・読みで検索できます
          </p>
          {geoStatus === "ok" && (
            <p className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/95">
              <MapPin className="h-3 w-3" />
              現在地から近い順で表示中
            </p>
          )}
        </div>

        <div className="border-t border-zinc-100 bg-card px-5 py-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="店舗名を検索"
              className="h-12 rounded-xl border-zinc-200 bg-zinc-50 pl-10 text-base shadow-inner focus-visible:border-[color:var(--joyfit-red)]/40"
            />
          </div>
        </div>
      </div>

      {nearestStore && (
        <div className="rounded-2xl border border-[color:var(--joyfit-red)]/25 bg-[color:var(--joyfit-red)]/5 p-4 shadow-sm">
          <p className="text-sm font-bold text-zinc-900">今いちばん近い店舗はこちらです。レビュー店舗はこの店舗で合っていますか？</p>
          <p className="mt-1 text-sm text-zinc-700">
            {nearestStore.store.name}
            {nearestStore.distanceMeters !== undefined ? `（現在地から約 ${formatDistance(nearestStore.distanceMeters)}）` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/member/${nearestStore.store.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
            >
              この店舗でレビューする
            </Link>
            <button
              type="button"
              onClick={() => setNearestPromptDismissed(true)}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              店舗一覧から選ぶ
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {filteredAndSorted.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-5 py-10 text-center text-sm text-muted-foreground">
            該当する店舗がありません。
            <br />
            別のキーワードでお試しください。
          </li>
        ) : (
          filteredAndSorted.map(({ store, distanceMeters }) => (
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
                    {distanceMeters !== undefined
                      ? `現在地から約 ${formatDistance(distanceMeters)}`
                      : storeSubtitle(store)}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-[color:var(--joyfit-red)]" />
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
