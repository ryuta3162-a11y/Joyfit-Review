/** 会員情報フォームの入力枠・ラベルを統一するためのクラス */

export const memberFormLabelClass =
  "mb-1.5 text-[13px] font-semibold tracking-tight text-zinc-800";

export const memberFormHintClass = "mt-1.5 text-[11px] leading-relaxed text-zinc-500";

export const memberFormErrorClass = "mt-1.5 text-[11px] font-medium text-[color:var(--joyfit-red)]";

/** テキスト・メール・セレクト共通 */
export const memberFormInputClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-base text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[color:var(--joyfit-red)] focus:ring-2 focus:ring-[color:var(--joyfit-red)]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[color:var(--joyfit-red)]/50 aria-invalid:ring-2 aria-invalid:ring-[color:var(--joyfit-red)]/15";

/** 会員番号の1桁セル */
export const memberFormDigitClass =
  "h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white text-center text-lg font-semibold tabular-nums text-zinc-900 shadow-sm outline-none transition caret-transparent focus:border-[color:var(--joyfit-red)] focus:ring-2 focus:ring-[color:var(--joyfit-red)]/20 aria-invalid:border-[color:var(--joyfit-red)]/50";
