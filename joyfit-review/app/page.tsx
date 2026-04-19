import Link from "next/link";
import { ArrowRight, Gift, MapPin } from "lucide-react";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import { ENJOY_POINT_REWARD_LABEL } from "@/lib/member-reward-copy";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <MemberPageShell>
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-card shadow-xl ring-1 ring-black/5">
        <div className="joyfit-brand-header px-6 pb-8 pt-8 text-center text-primary-foreground">
          <JoyfitHeaderLogo className="mb-1" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-[1.65rem]">口コミサポート</h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/90">
            店舗を選び、感想を整えて
            <br />
            Googleマップの口コミ投稿へスムーズにご案内します。
          </p>
          <div className="mt-5 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/95">
              <MapPin className="h-3.5 w-3.5 opacity-90" />
              店内POP・QRからアクセス
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
              <Gift className="h-3.5 w-3.5 opacity-90" />
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
              <span>満足度とよかった点をタップ</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--joyfit-red)]/12 text-xs font-bold text-[color:var(--joyfit-red)]">
                3
              </span>
              <span>文章をコピーしてGoogleに貼り付け</span>
            </li>
          </ul>

          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white shadow-md hover:bg-[color:var(--joyfit-red-dark)]"
          >
            <Link href="/select-store">
              店舗を選んで開始する
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] font-medium uppercase tracking-widest text-white/75">
        JOYFIT Review Support
      </p>
    </MemberPageShell>
  );
}
