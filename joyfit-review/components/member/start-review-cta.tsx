"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Brand } from "@/lib/brand";
import { acquireReviewGeo, reviewGeoFailureMessage } from "@/lib/review-geo-client";

type Props = {
  brand: Brand;
};

export function StartReviewCta({ brand }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setErr(null);
    setBusy(true);

    const result = await acquireReviewGeo();
    if (result.ok) {
      router.push(`/${brand}/select-store`);
      return;
    }

    setBusy(false);
    setErr(reviewGeoFailureMessage(result.reason));
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
        className={
          brand === "fit365"
            ? "h-12 w-full rounded-xl border-0 bg-zinc-900 !text-white hover:bg-zinc-800"
            : "h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] !text-white hover:bg-[color:var(--joyfit-red-dark)]"
        }
        onClick={start}
        disabled={busy}
      >
        {busy ? "位置情報の許可を確認中…" : "店舗を選んで開始する"}
        {!busy ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
    </div>
  );
}
