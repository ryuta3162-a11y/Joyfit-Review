import Image from "next/image";

import { BRAND_THEMES, type Brand } from "@/lib/brand";

const YOGA_LOGO_WIDTH = 832;
const YOGA_LOGO_HEIGHT = 95;

type Props = {
  /** ヘッダー内の余白に合わせて調整 */
  className?: string;
  /** 店舗ブランドに応じてロゴを切り替え（FIT365 はテキストロゴで代替） */
  brand?: Brand;
};

/** 黒背景ロゴを白枠内で見せる（mix-blend-screen で黒を白に落とす） */
function YogaLogoBadge({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  const yogaLogo = BRAND_THEMES.yoga.logoSrc;
  if (!yogaLogo) return null;

  return (
    <div
      className={`inline-flex w-fit items-center justify-center rounded-xl border border-white/90 bg-white px-3.5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.14)] ${className ?? ""}`}
    >
      <Image
        src={yogaLogo}
        alt={BRAND_THEMES.yoga.logoAlt ?? "JOY FIT YOGA"}
        width={YOGA_LOGO_WIDTH}
        height={YOGA_LOGO_HEIGHT}
        priority
        className={`block h-8 w-auto object-contain mix-blend-screen md:h-9 ${imageClassName ?? ""}`}
      />
    </div>
  );
}

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

  if (brand === "yoga") {
    return (
      <div className={`relative z-[1] flex justify-center ${className ?? ""}`}>
        <YogaLogoBadge />
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

  if (brand === "yoga") {
    return <YogaLogoBadge imageClassName="h-9 md:h-10" />;
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
