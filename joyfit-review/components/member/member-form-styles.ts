import { cn } from "@/lib/utils";

/** 会員向け画面のカード外枠（トップ・店舗選択・口コミフロー共通） */
export const memberFormCardClass =
  "overflow-hidden rounded-2xl border border-zinc-100/90 bg-white shadow-[0_2px_12px_rgba(24,24,27,0.05),0_1px_3px_rgba(165,53,75,0.08)]";

/** フォーム内の白パネル */
export const memberFormPanelClass =
  "rounded-2xl border border-zinc-100/90 bg-white p-5 shadow-[0_1px_6px_rgba(24,24,27,0.04)] md:p-6";

/** アプリ案内の入れ子カード */
export const memberFormGuideCardClass =
  "overflow-hidden rounded-2xl border border-zinc-100/90 bg-white shadow-[0_1px_4px_rgba(24,24,27,0.04)]";

export const memberFormSectionTitleClass =
  "text-[15px] font-semibold tracking-tight text-zinc-900";

export const memberFormLabelClass =
  "mb-1.5 text-[15px] font-semibold tracking-tight text-zinc-800";

export const memberFormHintClass = "mt-1.5 text-[13px] leading-relaxed text-zinc-500";

export const memberFormErrorClass = "mt-1.5 text-[13px] font-medium text-[color:var(--joyfit-red)]";

/** 会員が触れる入力欄（枠線はやや黒めで視認性を確保） */
export const memberFormInputClass =
  "h-11 w-full rounded-xl border border-zinc-800/75 bg-white px-3.5 text-base text-zinc-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[color:var(--joyfit-red)] aria-invalid:ring-2 aria-invalid:ring-[color:var(--joyfit-red)]/12";

export const memberFormTextareaClass =
  "min-h-16 w-full rounded-xl border border-zinc-800/75 bg-white px-3.5 py-2.5 text-base text-zinc-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10";

const memberFormChoiceBase =
  "rounded-xl border px-3 py-2.5 text-[13px] font-semibold leading-snug transition-all duration-200";

/** 性別など、タップして選ぶボタン（未選択時） */
const memberFormChoiceInactive =
  "border border-zinc-800/75 bg-white text-zinc-800 shadow-sm hover:border-zinc-900 hover:bg-zinc-50/80";

const memberFormChoiceActive =
  "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-md shadow-[color:var(--joyfit-red)]/18";

/** 性別・タグ選択ボタン */
export function memberFormChoiceClass(active: boolean) {
  return cn(memberFormChoiceBase, active ? memberFormChoiceActive : memberFormChoiceInactive);
}

/** 高評価タグ（やや大きめ） */
export function memberFormTagClass(active: boolean) {
  return cn(
    "rounded-xl border px-3 py-3 text-[13px] font-semibold leading-snug transition-all duration-200",
    active ? memberFormChoiceActive : memberFormChoiceInactive,
  );
}

