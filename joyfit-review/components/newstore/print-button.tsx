"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-[14px] font-bold text-[#a5354b] shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
    >
      印刷する
    </button>
  );
}
