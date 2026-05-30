import Image from "next/image";

import { cn } from "@/lib/utils";

/** 会員番号確認・アプリ登録のスクリーンショット枠（高さ・見た目を統一） */
const SCREENSHOT_HEIGHT = "h-[220px]";

type Props = {
  step: string;
  caption: string;
  src: string;
  alt: string;
  variant?: "neutral" | "orange";
};

export function AppGuideScreenshot({ step, caption, src, alt, variant = "neutral" }: Props) {
  const isOrange = variant === "orange";

  return (
    <figure
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-white shadow-[0_1px_4px_rgba(24,24,27,0.05)]",
        isOrange ? "border-orange-200/50" : "border-zinc-100/90",
      )}
    >
      <figcaption
        className={cn(
          "flex min-h-[2.75rem] shrink-0 items-center gap-1.5 border-b px-2 py-1.5",
          isOrange ? "border-orange-100 bg-orange-50/80" : "border-zinc-100 bg-white",
        )}
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white",
            isOrange ? "bg-orange-500" : "bg-zinc-800",
          )}
        >
          {step}
        </span>
        <span className="text-[10px] font-semibold leading-tight text-zinc-700">{caption}</span>
      </figcaption>
      <div className={cn("relative w-full shrink-0 bg-white", SCREENSHOT_HEIGHT)}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain object-top p-1"
          sizes="(max-width: 640px) 45vw, 200px"
        />
      </div>
    </figure>
  );
}
