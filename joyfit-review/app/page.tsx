import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { memberFormCardClass } from "@/components/member/member-form-styles";
import { BRAND_THEMES } from "@/lib/brand";

const cards: Array<{
  brand: "joyfit" | "fit365";
  description: string;
}> = [
  {
    brand: "joyfit",
    description: "JOYFIT24・JOYFIT24ジムLITE 各店舗のアンケート",
  },
  {
    brand: "fit365",
    description: "FIT365 各店舗のアンケート",
  },
];

export default function BrandSelectorPage() {
  return (
    <MemberPageShell>
      <div className={memberFormCardClass}>
        <div className="bg-zinc-50/60 px-6 pb-6 pt-7 text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500">
            JOYFIT / FIT365
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">
            アンケートページ
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-600">
            ご利用ブランドを選択してください。
            <br />
            アンケート・クチコミにご協力ください。
          </p>
        </div>

        <div className="space-y-3 px-5 pb-7 pt-1 md:px-6">
          {cards.map(({ brand, description }) => {
            const theme = BRAND_THEMES[brand];
            return (
              <Link
                key={brand}
                href={`/${brand}`}
                className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div
                  className={`relative flex items-center gap-4 px-5 py-5 ${
                    brand === "fit365" ? "text-zinc-900" : "text-white"
                  }`}
                  style={{ background: theme.primary }}
                >
                  {brand === "fit365" ? (
                    <div className="relative h-16 w-24 shrink-0">
                      <Image
                        src="/fit365-bears.png"
                        alt="FIT365 ベアクマ"
                        fill
                        sizes="96px"
                        className="object-contain object-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
                      />
                    </div>
                  ) : (
                    <div className="relative h-12 w-24 shrink-0">
                      <Image
                        src="/joyfit-logo.png"
                        alt="JOYFIT24"
                        fill
                        sizes="96px"
                        className="object-contain object-left"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 text-left">
                    <p
                      className={`text-[11px] font-semibold tracking-[0.18em] ${
                        brand === "fit365" ? "text-zinc-900/70" : "text-white/80"
                      }`}
                    >
                      {theme.fullLabel}
                    </p>
                    <p className="mt-0.5 text-base font-bold leading-snug">
                      アンケートに進む
                    </p>
                    <p
                      className={`mt-1 text-[11px] leading-relaxed ${
                        brand === "fit365" ? "text-zinc-900/75" : "text-white/85"
                      }`}
                    >
                      {description}
                    </p>
                  </div>

                  <ArrowRight
                    className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 ${
                      brand === "fit365" ? "text-zinc-900/70" : "text-white/85"
                    }`}
                  />
                </div>
              </Link>
            );
          })}

          <p className="mt-2 px-1 text-[11px] leading-relaxed text-zinc-500">
            ※ 店舗の QR コードからご利用の場合は、自動でブランド別ページに移動します。
          </p>
        </div>
      </div>
    </MemberPageShell>
  );
}
