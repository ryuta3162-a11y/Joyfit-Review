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
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200",
        checked
          ? "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] shadow-sm shadow-[color:var(--joyfit-red)]/25"
          : "border-zinc-300 bg-white group-hover:border-zinc-400",
      )}
      aria-hidden
    >
      <Check
        className={cn(
          "h-3.5 w-3.5 text-white transition-all duration-200",
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
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50 via-white to-white shadow-[0_8px_30px_rgba(24,24,27,0.06)]">
      <div className="border-b border-zinc-100 bg-white/90 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--joyfit-red)]/10 text-[color:var(--joyfit-red)]">
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
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold tabular-nums text-zinc-600">
            {completedCount}/{steps.length}
          </span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--joyfit-red)] to-[color:var(--brand-soft)] transition-all duration-500 ease-out"
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
                  ? "border-emerald-200/80 bg-emerald-50/40 shadow-sm"
                  : unlocked
                    ? "border-zinc-200 bg-white shadow-[0_2px_8px_rgba(24,24,27,0.04)]"
                    : "border-zinc-100 bg-zinc-50/80",
              )}
            >
              <div className="flex items-center gap-2.5 border-b border-zinc-100/80 px-4 py-2.5">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    checked
                      ? "bg-emerald-500 text-white"
                      : unlocked
                        ? "bg-[color:var(--joyfit-red)] text-white"
                        : "bg-zinc-200 text-zinc-500",
                  )}
                >
                  {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.stepNumber}
                </span>
                <p className="text-[13px] font-semibold leading-snug text-zinc-800">{step.question}</p>
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

                {step.key === "reward" && (
                  <div className="mb-3 rounded-lg border border-[color:var(--joyfit-red)]/20 bg-[color:var(--joyfit-red)]/5 px-3.5 py-3">
                    <p className="text-center text-sm font-bold leading-snug text-[color:var(--joyfit-red-dark)]">
                      {reward.rewardLabel}
                    </p>
                    {reward.rewardPointLearnMoreUrl && reward.rewardPointLearnMoreLabel && (
                      <p className="mt-1.5 text-center text-xs text-zinc-500">
                        {reward.rewardPointLearnMoreLabel}
                      </p>
                    )}
                  </div>
                )}

                <p className="mb-3 text-[12px] leading-relaxed text-zinc-500">{step.hint}</p>

                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onToggle(step.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
                    locked && "cursor-not-allowed",
                    checked
                      ? "border-emerald-300 bg-emerald-50/80"
                      : unlocked
                        ? "border-zinc-200 bg-zinc-50/50 hover:border-[color:var(--joyfit-red)]/35 hover:bg-white"
                        : "border-zinc-100 bg-zinc-50",
                  )}
                  aria-pressed={checked}
                >
                  <ConsentCheckbox checked={checked} />
                  <span
                    className={cn(
                      "text-[13px] font-semibold leading-snug",
                      checked ? "text-emerald-800" : "text-zinc-800",
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
