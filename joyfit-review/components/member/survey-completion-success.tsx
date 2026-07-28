import { Check } from "lucide-react";

import { memberFormBodyClass } from "@/components/member/member-form-styles";
import {
  formatSurveyCompletionRewardLabel,
  REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL,
  SURVEY_COMPLETION_POINT_PENDING_NOTE,
  SURVEY_COMPLETION_REWARD_NOTE,
  SURVEY_COMPLETION_THANK_YOU,
} from "@/lib/member-reward-copy";

type Props = {
  rewardLabel: string;
  reviewUrl: string;
};

export function SurveyCompletionSuccess({ rewardLabel, reviewUrl }: Props) {
  const completionRewardLabel = formatSurveyCompletionRewardLabel(rewardLabel);

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
          {SURVEY_COMPLETION_POINT_PENDING_NOTE}
        </p>

        {reviewUrl.trim() ? (
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="survey-success-fade-up survey-success-fade-up--delay-4 mx-auto mt-7 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(165,53,75,0.65)] transition hover:bg-[color:var(--joyfit-red-dark)]"
          >
            {REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL}
          </a>
        ) : null}
      </div>
    </>
  );
}
