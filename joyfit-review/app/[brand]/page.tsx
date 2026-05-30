import { notFound } from "next/navigation";
import { Gift, MapPin } from "lucide-react";

import { Fit365Header } from "@/components/joyfit/fit365-header";
import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import { StartReviewCta } from "@/components/member/start-review-cta";
import { memberFormCardClass } from "@/components/member/member-form-styles";
import { BRAND_THEMES, brandCssVars, parseBrandParam } from "@/lib/brand";

type Props = {
  params: Promise<{ brand: string }>;
};

export default async function BrandHomePage({ params }: Props) {
  const { brand: raw } = await params;
  const brand = parseBrandParam(raw);
  if (!brand) notFound();

  const theme = BRAND_THEMES[brand];
  const brandVars = brandCssVars(theme);
  const hasMascot = Boolean(theme.mascotSrc);
  const isFit365 = brand === "fit365";

  // FIT365: ピンク × グレー × 黒 × 白 の 4 色構成。
  // JOYFIT: 既存のレッド系をそのまま踏襲。
  const stepBadgeClass = isFit365
    ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
    : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--joyfit-red)]/12 text-xs font-bold text-[color:var(--joyfit-red)]";

  const locationCardClass = isFit365
    ? "rounded-2xl border border-zinc-900/15 bg-zinc-50 px-4 py-3 text-center shadow-sm"
    : "rounded-2xl border border-[color:var(--joyfit-red)]/25 bg-gradient-to-br from-[color:var(--joyfit-red)]/10 via-white to-white px-4 py-3 text-center shadow-sm";

  const locationBadgeClass = isFit365
    ? "inline-flex items-center rounded-full bg-[color:var(--joyfit-red)] px-3 py-1 text-[11px] font-semibold text-white"
    : "inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[color:var(--joyfit-red)] ring-1 ring-[color:var(--joyfit-red)]/20";

  const locationTitleClass = isFit365
    ? "mt-2 text-lg font-extrabold tracking-tight text-zinc-900 md:text-xl"
    : "mt-2 text-lg font-extrabold tracking-tight text-[color:var(--joyfit-red)] md:text-xl";

  const stepTextClass = isFit365 ? "text-zinc-900" : "text-muted-foreground";

  return (
    <MemberPageShell>
      <div
        data-brand={brand}
        className={memberFormCardClass}
        style={brandVars}
      >
        {isFit365 && hasMascot ? (
          <Fit365Header
            title={
              <h1 className="whitespace-nowrap text-[1.45rem] font-bold tracking-tight md:text-[1.7rem]">
                FIT365 アンケートページ
              </h1>
            }
          >
            <p className="relative z-[1] mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/95">
              アンケート・クチコミにご協力ください。
            </p>
            <div className="relative z-[1] mt-6 flex justify-center">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/60 bg-white/15 px-4 py-1.5 text-[11px] font-medium text-white">
                <Gift className="h-3.5 w-3.5 shrink-0 opacity-90" />
                <span className="leading-tight">{theme.rewardLabel}</span>
              </div>
            </div>
          </Fit365Header>
        ) : (
          <div className="joyfit-brand-header px-6 pb-9 pt-8 text-center text-white md:pt-10">
            <JoyfitHeaderLogo brand={brand} />
            <h1 className="relative z-[1] mt-5 text-2xl font-bold tracking-tight md:text-[1.65rem]">
              アンケートページ
            </h1>
            <p className="relative z-[1] mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/95">
              アンケート・クチコミにご協力ください。
            </p>
            <div className="relative z-[1] mt-6 flex justify-center">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/60 bg-white/15 px-4 py-1.5 text-[11px] font-medium text-white">
                <Gift className="h-3.5 w-3.5 shrink-0 opacity-90" />
                <span className="leading-tight">{theme.rewardLabel}</span>
              </div>
            </div>
          </div>
        )}

          <div className="space-y-5 px-6 py-8">
            <ul className={`space-y-3 text-sm ${stepTextClass}`}>
              <li className="flex gap-2">
                <span className={stepBadgeClass}>1</span>
                <span>店舗を検索して選択</span>
              </li>
              <li className="flex gap-2">
                <span className={stepBadgeClass}>2</span>
                <span>アンケートに回答（評価とよかった点をタップ）</span>
              </li>
              <li className="flex gap-2">
                <span className={stepBadgeClass}>3</span>
                <span>必要に応じてGoogleクチコミ投稿へ</span>
              </li>
            </ul>

            <div className={locationCardClass}>
              <p className={locationBadgeClass}>
                <MapPin className="mr-1 h-3.5 w-3.5" aria-hidden />
                LOCATION
              </p>
              <p className={locationTitleClass}>位置情報の許可が必要です</p>
            </div>

            <StartReviewCta brand={brand} />
          </div>
      </div>
    </MemberPageShell>
  );
}
