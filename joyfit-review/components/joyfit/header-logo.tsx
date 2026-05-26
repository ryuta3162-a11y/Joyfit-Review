import Image from "next/image";

import type { Brand } from "@/lib/brand";

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
