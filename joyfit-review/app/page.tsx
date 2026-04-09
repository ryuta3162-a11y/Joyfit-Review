import Link from "next/link";
import { ArrowRight, Gift, MapPin } from "lucide-react";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { ENJOY_POINT_REWARD_LABEL } from "@/lib/member-reward-copy";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <MemberPageShell>
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-xl ring-1 ring-black/5">
        <div className="joyfit-brand-header px-6 pb-8 pt-10 text-center text-primary-foreground">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80">JOYFIT</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-[1.65rem]">口コミサポート</h1>
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
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-1.5 text-xs font-semibold text-amber-50">
              <Gift className="h-3.5 w-3.5 opacity-90" />
              特典：{ENJOY_POINT_REWARD_LABEL}
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-8">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                1
              </span>
              <span>店舗を検索して選択</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                2
              </span>
              <span>満足度とよかった点をタップ</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                3
              </span>
              <span>文章をコピーしてGoogleに貼り付け</span>
            </li>
          </ul>

          <Button asChild size="lg" className="h-12 w-full rounded-xl text-base font-semibold shadow-md">
            <Link href="/select-store">
              店舗を選んで開始する
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80">
        JOYFIT Review Support
      </p>
    </MemberPageShell>
  );
}
