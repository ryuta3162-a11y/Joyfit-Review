import Image from "next/image";

import { BRAND_THEMES, type Brand } from "@/lib/brand";

type Props = {
  /** ヘッダー内の余白に合わせて調整 */
  className?: string;
  /** 店舗ブランドに応じてロゴを切り替え（FIT365 はテキストロゴで代替） */
  brand?: Brand;
};

export function JoyfitHeaderLogo({ className, brand = "joyfit" }: Props) {
  if (brand === "fit365") {
    return (
      <div className={`relative z-[1] flex justify-center ${className ?? ""}`}>
        <span className="inline-flex items-center rounded-xl bg-white px-5 py-2 text-[1.55rem] font-black leading-none tracking-[-0.01em] text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          FIT365
        </span>
      </div>
    );
  }

  const yogaLogo = BRAND_THEMES.yoga.logoSrc;
  if (brand === "yoga" && yogaLogo) {
    return (
      <div className={`relative z-[1] flex justify-center ${className ?? ""}`}>
        <div className="rounded-xl bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <Image
            src={yogaLogo}
            alt={BRAND_THEMES.yoga.logoAlt ?? "JOY FIT YOGA"}
            width={280}
            height={72}
            priority
            className="h-8 w-auto max-w-[min(100%,220px)] object-contain object-center md:h-9"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative z-[1] flex justify-center ${className ?? ""}`}>
      <Image
        src="/joyfit-logo.png"
        alt="JOYFIT24"
        width={360}
        height={90}
        priority
        className="h-9 w-auto max-w-[min(100%,300px)] object-contain object-center md:h-10"
      />
    </div>
  );
}

export function BrandSelectorLogo({ brand }: { brand: Brand }) {
  if (brand === "fit365") {
    return null;
  }

  const theme = BRAND_THEMES[brand];
  if (brand === "yoga" && theme.logoSrc) {
    return (
      <div className="shrink-0 rounded-xl bg-white px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
        <Image
          src={theme.logoSrc}
          alt={theme.logoAlt ?? "JOY FIT YOGA"}
          width={220}
          height={56}
          className="h-9 w-auto max-w-[8.5rem] object-contain object-left"
        />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-24 shrink-0">
      <Image
        src="/joyfit-logo.png"
        alt="JOYFIT24"
        fill
        sizes="96px"
        className="object-contain object-left"
      />
    </div>
  );
}
