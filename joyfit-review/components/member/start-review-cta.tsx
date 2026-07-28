"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Brand } from "@/lib/brand";
import { acquireReviewGeo, reviewGeoFailureMessage } from "@/lib/review-geo-client";

type Props = {
  brand: Brand;
  /** 指定時は位置情報を取らず、この URL へ直接進む（YOGA 1店舗向け） */
  directHref?: string;
  /** ボタン文言（未指定時はブランド既定） */
  label?: string;
};

export function StartReviewCta({ brand, directHref, label }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setErr(null);
    setBusy(true);

    // YOGA は1店舗のみ。位置情報は不要（取得失敗時も geo に落とさない）
    if (brand === "yoga") {
      router.push(directHref || "/yoga/select-store");
      return;
    }

    if (directHref) {
      router.push(directHref);
      return;
    }

    const result = await acquireReviewGeo();
    if (result.ok) {
      router.push(`/${brand}/select-store`);
      return;
    }

    setBusy(false);
    setErr(reviewGeoFailureMessage(result.reason));
  }

  const idleLabel = label ?? "店舗を選んで開始する";
  const busyLabel =
    brand === "yoga" || directHref ? "移動しています…" : "位置情報の許可を確認中…";

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
        {busy ? busyLabel : idleLabel}
        {!busy ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
    </div>
  );
}
