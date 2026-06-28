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
    <div className="flex items-center justify-center gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= rating;
        return (
          <Star
            key={value}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9",
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
        "relative flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border transition-all duration-300",
        checked
          ? "border-[color:var(--joyfit-red-dark)] bg-gradient-to-b from-[color:var(--brand-soft)] to-[color:var(--joyfit-red)] shadow-[0_2px_0_rgba(0,0,0,0.14),0_4px_10px_rgba(165,53,75,0.22),inset_0_1px_0_rgba(255,255,255,0.35)]"
          : "border-zinc-300/90 bg-gradient-to-b from-white to-zinc-100 shadow-[inset_0_2px_3px_rgba(0,0,0,0.07),0_1px_0_rgba(255,255,255,0.95)] group-hover:border-zinc-400 group-hover:from-white group-hover:to-zinc-50",
      )}
      aria-hidden
    >
      <Check
        className={cn(
          "h-3.5 w-3.5 text-white drop-shadow-sm transition-all duration-300",
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
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50/90 via-white to-white shadow-[0_8px_28px_rgba(24,24,27,0.07),0_2px_6px_rgba(165,53,75,0.05)]">
      <div className="border-b border-[color:var(--joyfit-red)]/10 bg-gradient-to-r from-white via-white to-[color:var(--joyfit-red)]/[0.04] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--joyfit-red)]/14 to-[color:var(--joyfit-red)]/6 text-[color:var(--joyfit-red)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_6px_rgba(165,53,75,0.1)]">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold tracking-tight text-zinc-900">
              {GOOGLE_POST_CONSENT_PANEL_TITLE}
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-500">
              {GOOGLE_POST_CONSENT_PANEL_SUBTITLE}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums transition-colors duration-300",
              completedCount === steps.length
                ? "bg-[color:var(--joyfit-red)] text-white shadow-[0_2px_6px_rgba(165,53,75,0.28)]"
                : "bg-zinc-100 text-zinc-600",
            )}
          >
            {completedCount}/{steps.length}
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--joyfit-red-dark)] via-[color:var(--joyfit-red)] to-[color:var(--brand-soft)] shadow-[0_1px_0_rgba(255,255,255,0.25)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ol className="space-y-3 p-4">
        {steps.map((step) => {
          const checked = consents[step.key];
          const unlocked = isStepUnlocked(step.key);
          const locked = !unlocked;

          return (
            <li
              key={step.key}
              className={cn(
                "overflow-hidden rounded-xl border transition-all duration-300",
                locked && "opacity-45",
                checked
                  ? "border-[color:var(--joyfit-red)]/28 bg-gradient-to-br from-[color:var(--joyfit-red)]/[0.07] via-white to-white shadow-[0_3px_12px_rgba(165,53,75,0.1)]"
                  : unlocked
                    ? "border-zinc-200/90 bg-white shadow-[0_2px_8px_rgba(24,24,27,0.04)]"
                    : "border-zinc-100 bg-zinc-50/80",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2.5 border-b px-4 py-2.5",
                  checked ? "border-[color:var(--joyfit-red)]/12 bg-[color:var(--joyfit-red)]/[0.03]" : "border-zinc-100/80",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    checked
                      ? "bg-gradient-to-b from-[color:var(--brand-soft)] to-[color:var(--joyfit-red-dark)] text-white shadow-[0_2px_0_rgba(0,0,0,0.12),0_3px_8px_rgba(165,53,75,0.28)]"
                      : unlocked
                        ? "bg-gradient-to-b from-[color:var(--joyfit-red)] to-[color:var(--joyfit-red-dark)] text-white shadow-[0_2px_6px_rgba(165,53,75,0.22)]"
                        : "bg-zinc-200 text-zinc-500",
                  )}
                >
                  {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.stepNumber}
                </span>
                {step.questionLines ? (
                  <p className="text-[13px] font-semibold leading-relaxed text-zinc-800">
                    {step.questionLines[0]}
                    <br />
                    {step.questionLines[1]}
                  </p>
                ) : (
                  <p className="text-[13px] font-semibold leading-snug text-zinc-800">{step.question}</p>
                )}
              </div>

              <div className="px-4 py-3">
                {step.key === "rating" && (
                  <div className="mb-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3">
                    <ConsentStars rating={rating} />
                    <p className="mt-2 text-center text-xs font-medium text-zinc-500">
                      投稿時も星{rating}を選択
                    </p>
                  </div>
                )}

                {step.key === "draft" && (
                  <div className="mb-3 max-h-36 overflow-y-auto rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-left shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
                      {draft.trim() || "（文面が空です）"}
                    </p>
                  </div>
                )}

                <p className="mb-3 text-[12px] leading-relaxed text-zinc-500">{step.hint}</p>

                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onToggle(step.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-300",
                    locked && "cursor-not-allowed",
                    checked
                      ? "border-[color:var(--joyfit-red)]/35 bg-gradient-to-b from-[color:var(--joyfit-red)]/10 to-[color:var(--joyfit-red)]/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_2px_6px_rgba(165,53,75,0.1)]"
                      : unlocked
                        ? "border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 shadow-[0_1px_0_rgba(255,255,255,0.9),inset_0_1px_2px_rgba(0,0,0,0.03)] hover:border-[color:var(--joyfit-red)]/30 hover:from-white hover:to-[color:var(--joyfit-red)]/[0.04]"
                        : "border-zinc-100 bg-zinc-50",
                  )}
                  aria-pressed={checked}
                >
                  <ConsentCheckbox checked={checked} />
                  <span
                    className={cn(
                      "text-[13px] font-semibold leading-snug transition-colors duration-300",
                      checked ? "text-[color:var(--joyfit-red-dark)]" : "text-zinc-800",
                    )}
                  >
                    {step.affirmLabel}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {completedCount < steps.length && (
        <p className="border-t border-zinc-100 px-5 py-3 text-center text-[12px] leading-relaxed text-zinc-500">
          {GOOGLE_POST_CONSENT_PROGRESS_HINT}
        </p>
      )}
    </div>
  );
}

export function isGooglePostFullyConsented(consents: GooglePostConsentState): boolean {
  return consents.rating && consents.draft && consents.reward;
}
