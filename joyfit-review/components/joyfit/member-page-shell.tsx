import type { ReactNode } from "react";

/**
 * 会員向け（QR・常設POP）画面の共通ラッパー
 */
export function MemberPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="joyfit-member-bg min-h-screen px-4 pb-10 pt-6 md:px-6 md:pt-8">
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </div>
  );
}
