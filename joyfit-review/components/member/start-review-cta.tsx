"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { REVIEW_GEO_STORAGE_KEY } from "@/lib/review-geo-storage";

export function StartReviewCta() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function start() {
    setErr(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErr(
        "お使いのブラウザでは位置情報を利用できません。別の端末またはブラウザでお試しください。",
      );
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sessionStorage.setItem(
          REVIEW_GEO_STORAGE_KEY,
          JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            t: Date.now(),
          }),
        );
        router.push("/select-store");
      },
      () => {
        setBusy(false);
        setErr(
          "口コミサポートのご利用には位置情報の許可が必要です。アドレスバー付近の鍵アイコン等から、当サイトへの位置情報の許可をオンにしてください。",
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-3">
      {err ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-center text-xs leading-relaxed text-destructive">
          {err}
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] !text-white hover:bg-[color:var(--joyfit-red-dark)]"
        onClick={start}
        disabled={busy}
      >
        {busy ? "位置情報の許可を確認中…" : "店舗を選んで開始する"}
        {!busy ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
    </div>
  );
}
