import type { ReactNode } from "react";

import { Fit365Mascot } from "@/components/joyfit/fit365-mascot";

type Props = {
  title: ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/** FIT365 用ヘッダー（クマ＋タイトルを同じ幅で縦に配置） */
export function Fit365Header({ title, children, className = "" }: Props) {
  return (
    <div
      className={`joyfit-brand-header px-6 pb-10 pt-6 text-center text-white md:px-8 md:pb-11 md:pt-7 ${className}`}
    >
      <div className="relative z-[1] mx-auto w-full max-w-[min(100%,20.5rem)] md:max-w-[24rem]">
        <div className="flex justify-center bg-[color:var(--joyfit-red)]">
          <Fit365Mascot
            priority
            className="h-auto w-full max-w-full object-contain"
          />
        </div>
        <div className="mt-6 md:mt-7">{title}</div>
      </div>
      {children}
    </div>
  );
}
