"use client";

import { Check } from "lucide-react";

import { memberFormBodyClass } from "@/components/member/member-form-styles";
import {
  formatSurveyCompletionRewardLabel,
  REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL,
  SURVEY_COMPLETION_POINT_PENDING_NOTE_LINES,
  SURVEY_COMPLETION_REVIEW_PREFACE_BODY_LINES,
  SURVEY_COMPLETION_REVIEW_PREFACE_TITLE,
  SURVEY_COMPLETION_REWARD_NOTE,
  SURVEY_COMPLETION_THANK_YOU,
} from "@/lib/member-reward-copy";

type Props = {
  rewardLabel: string;
  reviewUrl: string;
  reviewDraft?: string;
};

async function copyReviewDraft(text: string) {
  const value = text.trim();
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* クリップボード制限があっても口コミページは開く */
  }
}

export function SurveyCompletionSuccess({
  rewardLabel,
  reviewUrl,
  reviewDraft = "",
}: Props) {
  const completionRewardLabel = formatSurveyCompletionRewardLabel(rewardLabel);
  const url = reviewUrl.trim();

  return (
    <>
      <div className="joyfit-brand-header px-6 pb-10 pt-12 text-center text-white">
        <div className="survey-success-icon mx-auto" aria-hidden>
          <span className="survey-success-ring" />
          <span className="survey-success-ring survey-success-ring--delay" />
          <span className="survey-success-circle">
            <Check className="survey-success-check h-7 w-7" strokeWidth={2.75} />
          </span>
        </div>

        <h2 className="survey-success-fade-up mt-7 text-[22px] font-bold tracking-tight">
          {SURVEY_COMPLETION_THANK_YOU}
        </h2>
        <p className="survey-success-fade-up survey-success-fade-up--delay-1 mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-white/90">
          {SURVEY_COMPLETION_REWARD_NOTE}
        </p>
      </div>

      <div className={`${memberFormBodyClass} px-6 py-8 text-center`}>
        <div className="survey-success-fade-up survey-success-fade-up--delay-2 mx-auto max-w-sm">
          <p className="mt-1 rounded-2xl border border-[color:var(--joyfit-red)]/15 bg-[color:var(--joyfit-red)]/4 px-5 py-4 text-[17px] font-bold leading-snug tracking-tight text-[color:var(--joyfit-red-dark)]">
            {completionRewardLabel}
          </p>
        </div>

        <p className="survey-success-fade-up survey-success-fade-up--delay-3 mx-auto mt-5 max-w-sm text-[13px] leading-relaxed text-zinc-500">
          {SURVEY_COMPLETION_POINT_PENDING_NOTE_LINES[0]}
          <br />
          {SURVEY_COMPLETION_POINT_PENDING_NOTE_LINES[1]}
        </p>

        {url ? (
          <div className="survey-success-fade-up survey-success-fade-up--delay-4 mx-auto mt-7 max-w-sm overflow-hidden rounded-2xl border-2 border-[color:var(--joyfit-red)]/35 bg-white text-left shadow-[0_8px_24px_-12px_rgba(165,53,75,0.35)]">
            <div className="px-5 pb-4 pt-5">
              <p className="text-[16px] font-bold leading-snug tracking-tight text-[color:var(--joyfit-red-dark)]">
                {SURVEY_COMPLETION_REVIEW_PREFACE_TITLE}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-700">
                {SURVEY_COMPLETION_REVIEW_PREFACE_BODY_LINES[0]}
                <br />
                {SURVEY_COMPLETION_REVIEW_PREFACE_BODY_LINES[1]}
              </p>
            </div>
            <div className="border-t border-[color:var(--joyfit-red)]/15 bg-[color:var(--joyfit-red)]/4 px-4 py-4">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void copyReviewDraft(reviewDraft);
                }}
                className="survey-google-open-btn inline-flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
              >
                {REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
