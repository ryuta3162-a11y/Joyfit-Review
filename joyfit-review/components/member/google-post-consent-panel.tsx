"use client";

import { Check, Star } from "lucide-react";

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
    <div className="flex items-center justify-center gap-1.5 py-1" aria-hidden>
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
        "relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
        checked
          ? "border-[color:var(--joyfit-red-dark)] bg-[color:var(--joyfit-red)]"
          : "border-zinc-400 bg-white",
      )}
      aria-hidden
    >
      <Check
        className={cn(
          "h-4 w-4 text-white transition-all duration-200",
          checked ? "scale-100 opacity-100" : "scale-75 opacity-0",
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
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-base font-bold tracking-tight text-zinc-900 md:text-[17px]">
            {GOOGLE_POST_CONSENT_PANEL_TITLE}
          </p>
          <span
            className={cn(
              "shrink-0 text-sm font-bold tabular-nums",
              completedCount === steps.length
                ? "text-[color:var(--joyfit-red)]"
                : "text-zinc-500",
            )}
          >
            {completedCount}/{steps.length}
          </span>
        </div>
        <p className="text-[15px] leading-relaxed text-zinc-600">{GOOGLE_POST_CONSENT_PANEL_SUBTITLE}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-[color:var(--joyfit-red)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ol className="w-full space-y-0">
        {steps.map((step, index) => {
          const checked = consents[step.key];
          const unlocked = isStepUnlocked(step.key);
          const locked = !unlocked;

          return (
            <li
              key={step.key}
              className={cn(
                "w-full space-y-3 border-t border-zinc-200/80 py-6",
                index === 0 && "border-t-0 pt-0",
                locked && "opacity-45",
              )}
            >
              {step.questionLines ? (
                <p className="w-full text-[16px] font-semibold leading-relaxed text-zinc-900">
                  <span className="mr-1.5 text-[color:var(--joyfit-red)]">{step.stepNumber}.</span>
                  {step.questionLines[0]}
                  <br />
                  {step.questionLines[1]}
                </p>
              ) : (
                <p className="w-full text-[16px] font-semibold leading-relaxed text-zinc-900">
                  <span className="mr-1.5 text-[color:var(--joyfit-red)]">{step.stepNumber}.</span>
                  {step.question}
                </p>
              )}

              {step.key === "rating" && (
                <>
                  <ConsentStars rating={rating} />
                  <p className="text-center text-[14px] text-zinc-500">投稿時も星{rating}を選択</p>
                </>
              )}

              {step.key === "draft" && (
                <p className="w-full whitespace-pre-wrap border-l-[3px] border-[color:var(--joyfit-red)]/40 pl-3 text-[15px] leading-relaxed text-zinc-800">
                  {draft.trim() || "（文面が空です）"}
                </p>
              )}

              <p className="w-full text-[14px] leading-relaxed text-zinc-500">{step.hint}</p>

              <button
                type="button"
                disabled={locked}
                onClick={() => onToggle(step.key)}
                className={cn(
                  "group flex w-full items-start gap-3 py-1 text-left transition-colors duration-200",
                  locked && "cursor-not-allowed",
                  checked ? "text-[color:var(--joyfit-red-dark)]" : "text-zinc-900",
                )}
                aria-pressed={checked}
              >
                <ConsentCheckbox checked={checked} />
                <span className="text-[16px] font-semibold leading-snug">{step.affirmLabel}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {completedCount < steps.length && (
        <p className="text-center text-[14px] leading-relaxed text-zinc-500">
          {GOOGLE_POST_CONSENT_PROGRESS_HINT}
        </p>
      )}
    </div>
  );
}

export function isGooglePostFullyConsented(consents: GooglePostConsentState): boolean {
  return consents.rating && consents.draft && consents.reward;
}
