import { Gift, MapPin } from "lucide-react";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import { StartReviewCta } from "@/components/member/start-review-cta";
import { ENJOY_POINT_REWARD_LABEL } from "@/lib/member-reward-copy";

export default function Home() {
  return (
    <MemberPageShell>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="joyfit-brand-header px-6 pb-8 pt-8 text-center text-white">
          <JoyfitHeaderLogo className="mb-1" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-[1.65rem]">口コミサポート</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/95">
            店舗を選び、Googleマップの口コミ投稿へ案内します。
          </p>
          <div className="mt-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-1.5 text-xs font-medium text-white">
              <Gift className="h-3.5 w-3.5 shrink-0 opacity-90" />
              特典：{ENJOY_POINT_REWARD_LABEL}
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-8">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--joyfit-red)]/12 text-xs font-bold text-[color:var(--joyfit-red)]">
                1
              </span>
              <span>店舗を検索して選択</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--joyfit-red)]/12 text-xs font-bold text-[color:var(--joyfit-red)]">
                2
              </span>
              <span>口コミ評価とよかった点をタップ</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--joyfit-red)]/12 text-xs font-bold text-[color:var(--joyfit-red)]">
                3
              </span>
              <span>文章をコピーしてGoogleに貼り付け</span>
            </li>
          </ul>

          <p className="flex gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--joyfit-red)]" aria-hidden />
            <span>
              <strong className="font-semibold text-foreground">位置情報の許可が必須です。</strong>
              下のボタンを押すと許可の確認が表示され、許可後に店舗選択へ進みます。許可いただけない場合はこのサービスをご利用いただけません。
            </span>
          </p>

          <StartReviewCta />
        </div>
      </div>
    </MemberPageShell>
  );
}
