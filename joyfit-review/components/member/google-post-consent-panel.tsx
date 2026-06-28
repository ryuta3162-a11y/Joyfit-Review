"use client";

import { Check, ShieldCheck, Star } from "lucide-react";

import {
  type GooglePostConsentKey,
  getGooglePostConsentSteps,
  GOOGLE_POST_CONSENT_PANEL_SUBTITLE,
  GOOGLE_POST_CONSENT_PANEL_TITLE,
  GOOGLE_POST_CONSENT_PROGRESS_HINT,
} from "@/lib/member-reward-copy";
import { type StoreRewardDisplay } from "@/lib/store-reward";
import { cn } from "@/lib/utils";

export type GooglePostConsentState = Record<GooglePostConsentKey, boolean>;

export const EMPTY_GOOGLE_POST_CONSENT: GooglePostConsentState = {
  rating: false,
  draft: false,
  reward: false,
};

type Props = {
  rating: number;
  draft: string;
  reward: StoreRewardDisplay;
  consents: GooglePostConsentState;
  onToggle: (key: GooglePostConsentKey) => void;
};

function ConsentStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= rating;
        return (
          <Star
            key={value}
            className={cn(
              "h-9 w-9 sm:h-10 sm:w-10",
              filled ? "fill-[#fbbc04] text-[#fbbc04]" : "text-zinc-300",
            )}
          />
        );
      })}
    </div>
  );
}

function ConsentCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border transition-all duration-300",
        checked
          ? "border-[color:var(--joyfit-red-dark)] bg-gradient-to-b from-[color:var(--brand-soft)] to-[color:var(--joyfit-red)] shadow-[0_2px_0_rgba(0,0,0,0.14),0_4px_10px_rgba(165,53,75,0.22),inset_0_1px_0_rgba(255,255,255,0.35)]"
          : "border-zinc-300/90 bg-gradient-to-b from-white to-zinc-100 shadow-[inset_0_2px_3px_rgba(0,0,0,0.07),0_1px_0_rgba(255,255,255,0.95)] group-hover:border-zinc-400 group-hover:from-white group-hover:to-zinc-50",
      )}
      aria-hidden
    >
      <Check
        className={cn(
          "h-4 w-4 text-white drop-shadow-sm transition-all duration-300",
          checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
        strokeWidth={3}
      />
    </span>
  );
}

export function GooglePostConsentPanel({ rating, draft, reward, consents, onToggle }: Props) {
  const steps = getGooglePostConsentSteps({ rating, rewardLabel: reward.rewardLabel });
  const completedCount = (Object.values(consents) as boolean[]).filter(Boolean).length;
  const progressPercent = (completedCount / steps.length) * 100;

  function isStepUnlocked(key: GooglePostConsentKey): boolean {
    if (key === "rating") return true;
    if (key === "draft") return consents.rating;
    return consents.rating && consents.draft;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--joyfit-red)]/10 text-[color:var(--joyfit-red)]">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold tracking-tight text-zinc-900 md:text-[17px]">
              {GOOGLE_POST_CONSENT_PANEL_TITLE}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-zinc-600">
              {GOOGLE_POST_CONSENT_PANEL_SUBTITLE}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums transition-colors duration-300",
              completedCount === steps.length
                ? "bg-[color:var(--joyfit-red)] text-white"
                : "bg-zinc-100 text-zinc-600",
            )}
          >
            {completedCount}/{steps.length}
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--joyfit-red-dark)] via-[color:var(--joyfit-red)] to-[color:var(--brand-soft)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ol className="space-y-0">
        {steps.map((step, index) => {
          const checked = consents[step.key];
          const unlocked = isStepUnlocked(step.key);
          const locked = !unlocked;

          return (
            <li
              key={step.key}
              className={cn(
                "border-t border-zinc-200/80 py-5 transition-colors duration-300",
                index === 0 && "border-t-0 pt-0",
                locked && "opacity-45",
                checked && "bg-[color:var(--joyfit-red)]/[0.04]",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    checked
                      ? "bg-gradient-to-b from-[color:var(--brand-soft)] to-[color:var(--joyfit-red-dark)] text-white shadow-[0_2px_6px_rgba(165,53,75,0.22)]"
                      : unlocked
                        ? "bg-[color:var(--joyfit-red)] text-white"
                        : "bg-zinc-200 text-zinc-500",
                  )}
                >
                  {checked ? <Check className="h-4 w-4" strokeWidth={3} /> : step.stepNumber}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  {step.questionLines ? (
                    <p className="text-[15px] font-semibold leading-relaxed text-zinc-900 md:text-base">
                      {step.questionLines[0]}
                      <br />
                      {step.questionLines[1]}
                    </p>
                  ) : (
                    <p className="text-[15px] font-semibold leading-relaxed text-zinc-900 md:text-base">
                      {step.question}
                    </p>
                  )}

                  {step.key === "rating" && (
                    <div className="py-1">
                      <ConsentStars rating={rating} />
                      <p className="mt-2 text-center text-[13px] font-medium text-zinc-500">
                        投稿時も星{rating}を選択
                      </p>
                    </div>
                  )}

                  {step.key === "draft" && (
                    <div className="max-h-40 overflow-y-auto rounded-xl bg-zinc-50/90 px-3 py-3 text-left">
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-800 md:text-[15px]">
                        {draft.trim() || "（文面が空です）"}
                      </p>
                    </div>
                  )}

                  <p className="text-[13px] leading-relaxed text-zinc-500 md:text-sm">{step.hint}</p>

                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onToggle(step.key)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-300",
                      locked && "cursor-not-allowed",
                      checked
                        ? "border-[color:var(--joyfit-red)]/40 bg-gradient-to-b from-[color:var(--brand-soft)]/22 to-[color:var(--joyfit-red)]/10"
                        : unlocked
                          ? "border-zinc-200 bg-white hover:border-[color:var(--joyfit-red)]/30 hover:bg-[color:var(--joyfit-red)]/[0.03]"
                          : "border-zinc-100 bg-zinc-50",
                    )}
                    aria-pressed={checked}
                  >
                    <ConsentCheckbox checked={checked} />
                    <span
                      className={cn(
                        "text-[14px] font-semibold leading-snug md:text-[15px]",
                        checked ? "text-[color:var(--joyfit-red-dark)]" : "text-zinc-800",
                      )}
                    >
                      {step.affirmLabel}
                    </span>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {completedCount < steps.length && (
        <p className="text-center text-[13px] leading-relaxed text-zinc-500 md:text-sm">
          {GOOGLE_POST_CONSENT_PROGRESS_HINT}
        </p>
      )}
    </div>
  );
}

export function isGooglePostFullyConsented(consents: GooglePostConsentState): boolean {
  return consents.rating && consents.draft && consents.reward;
}
