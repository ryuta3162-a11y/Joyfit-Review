"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Star } from "lucide-react";

import { submitEventSurvey } from "@/app/actions/submit-event-survey";
import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import {
  memberFormBodyClass,
  memberFormCardClass,
  memberFormChoiceClass,
  memberFormInputClass,
  memberFormTagClass,
  memberFormTextareaClass,
} from "@/components/member/member-form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { brandCssVars, BRAND_THEMES } from "@/lib/brand";
import {
  buildEventReviewDraft,
  CONCERN_OPTIONS,
  EXPERIENCE_OPTIONS,
  FUTURE_EVENT_OPTIONS,
  INSTAGRAM_ACCOUNT_OPTIONS,
  INTEREST_OPTIONS,
  PILATES_TRIAL_EVENT,
  toggleMulti,
  TRIGGER_OPTIONS,
} from "@/lib/event-pilates-trial-202609";
import { REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL } from "@/lib/member-reward-copy";
import { cn } from "@/lib/utils";

type Props = {
  reviewUrl: string;
};

const stars = [1, 2, 3, 4, 5] as const;

const LABEL = {
  other: "その他",
  igTrigger: "インスグラムで告知を見たため",
  pilatesAgain: "もう一度！マシンピラティス体験",
  yogaTrial: "ヨガ体験",
} as const;

function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function SectionHeader({
  step,
  title,
  required,
  hint,
}: {
  step: number;
  title: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[color:var(--joyfit-red)] px-2 text-[11px] font-bold text-white">
          {step}
        </span>
        <p className="text-[15px] font-semibold tracking-tight text-zinc-900">{title}</p>
        {required ? (
          <span className="rounded-md bg-[color:var(--joyfit-red)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--joyfit-red)]">
            必須
          </span>
        ) : (
          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
            任意
          </span>
        )}
      </div>
      {hint ? <p className="pl-8 text-[12px] leading-relaxed text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function ChoiceGrid({
  options,
  selected,
  onToggle,
  multi,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (opt: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            className={multi ? memberFormTagClass(active) : memberFormChoiceClass(active)}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function PilatesTrialEventSurvey({ reviewUrl }: Props) {
  const theme = BRAND_THEMES.yoga;
  const brandVars = useMemo(() => brandCssVars(theme), [theme]);
  const submissionIdRef = useRef(newSubmissionId());

  const [rating, setRating] = useState<number | null>(null);
  const [experience, setExperience] = useState<string[]>([]);
  const [experienceOther, setExperienceOther] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [triggerOther, setTriggerOther] = useState("");
  const [instagramAccounts, setInstagramAccounts] = useState<string[]>([]);
  const [futureEvents, setFutureEvents] = useState<string[]>([]);
  const [futureEventOther, setFutureEventOther] = useState("");
  const [pilatesMinutes, setPilatesMinutes] = useState("");
  const [yogaMinutes, setYogaMinutes] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [concernOther, setConcernOther] = useState("");
  const [interest, setInterest] = useState("");
  const [impression, setImpression] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [draft, setDraft] = useState("");

  const needsExperienceOther = experience.includes(LABEL.other);
  const needsTriggerOther = triggers.includes(LABEL.other);
  const needsInstagram = triggers.includes(LABEL.igTrigger);
  const needsFutureOther = futureEvents.includes(LABEL.other);
  const needsPilatesMinutes = futureEvents.includes(LABEL.pilatesAgain);
  const needsYogaMinutes = futureEvents.includes(LABEL.yogaTrial);
  const needsConcernOther = concerns.includes(LABEL.other);

  const emailTrimmed = email.trim();
  const emailInvalid = Boolean(emailTrimmed) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);

  // 選択系は必須。自由記述（感想・任意プロフィール）は空でも送信可
  const canSubmit =
    rating !== null &&
    experience.length > 0 &&
    (!needsExperienceOther || experienceOther.trim()) &&
    triggers.length > 0 &&
    (!needsTriggerOther || triggerOther.trim()) &&
    (!needsInstagram || instagramAccounts.length > 0) &&
    futureEvents.length > 0 &&
    (!needsFutureOther || futureEventOther.trim()) &&
    concerns.length > 0 &&
    (!needsConcernOther || concernOther.trim()) &&
    Boolean(interest) &&
    !emailInvalid;

  async function handleSubmit() {
    if (!canSubmit || rating === null || submitting || sent) return;
    setSubmitting(true);
    setSubmitError(null);

    const generatedReview = buildEventReviewDraft({
      rating,
      experience,
      impression,
    });

    const result = await submitEventSurvey({
      eventId: PILATES_TRIAL_EVENT.eventId,
      eventName: PILATES_TRIAL_EVENT.eventName,
      rating,
      experience,
      experienceOther: needsExperienceOther ? experienceOther : "",
      triggers,
      triggerOther: needsTriggerOther ? triggerOther : "",
      instagramAccounts: needsInstagram ? instagramAccounts : [],
      futureEvents,
      futureEventOther: needsFutureOther ? futureEventOther : "",
      pilatesMinutes: needsPilatesMinutes ? pilatesMinutes : "",
      yogaMinutes: needsYogaMinutes ? yogaMinutes : "",
      concerns,
      concernOther: needsConcernOther ? concernOther : "",
      interest,
      impression,
      fullName,
      age,
      email: emailTrimmed,
      address: address.trim(),
      generatedReview,
      submissionId: submissionIdRef.current,
    });

    if (!result.ok) {
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    setDraft(generatedReview);
    if (rating >= 4 && reviewUrl.trim()) {
      try {
        await navigator.clipboard.writeText(generatedReview);
      } catch {
        /* ignore */
      }
      window.open(reviewUrl, "_blank", "noopener,noreferrer");
    }
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    if (rating !== null && rating >= 4 && reviewUrl.trim()) {
      return (
        <div data-brand="yoga" className={memberFormCardClass} style={brandVars}>
          <div className="joyfit-brand-header px-6 pb-10 pt-12 text-center text-white">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <Check className="h-7 w-7" strokeWidth={2.75} />
            </div>
            <h2 className="mt-7 text-[22px] font-bold tracking-tight">ご協力ありがとうございます</h2>
            <p className="mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-white/90">
              体験会へのご回答ありがとうございました。
              <br />
              よろしければGoogle口コミにもご協力ください。
            </p>
          </div>
          <div className={`${memberFormBodyClass} px-6 py-8 text-center`}>
            {draft ? (
              <div className="mx-auto max-w-sm text-left">
                <p className="mb-2 text-[13px] font-semibold text-zinc-700">口コミ文面（コピー済み）</p>
                <pre className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-zinc-800">
                  {draft}
                </pre>
              </div>
            ) : null}
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-7 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white transition hover:bg-[color:var(--joyfit-red-dark)]"
            >
              {REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL}
            </a>
          </div>
        </div>
      );
    }

    return (
      <div data-brand="yoga" className={memberFormCardClass} style={brandVars}>
        <div className="joyfit-brand-header px-6 py-12 text-center text-white">
          <h2 className="text-xl font-bold">ご回答ありがとうございます</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-white/90">
            体験会へのご参加、ありがとうございました。
            <br />
            貴重なご意見を今後の参考にさせていただきます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-brand="yoga"
      className={`${memberFormCardClass} text-foreground`}
      style={brandVars}
    >
      <div className="joyfit-brand-header px-5 pb-7 pt-6 text-center text-white md:px-6 md:pt-8">
        <JoyfitHeaderLogo brand="yoga" />
        <h1 className="relative z-[1] mt-5 text-xl font-bold md:text-2xl">
          {PILATES_TRIAL_EVENT.title}
        </h1>
        <p className="relative z-[1] mt-2 text-[13px] text-white/90">
          {PILATES_TRIAL_EVENT.dateLabel}
        </p>
      </div>

      <div className={`${memberFormBodyClass} space-y-7`}>
        <section className="space-y-3">
          <SectionHeader
            step={1}
            title="今回の体験を星で評価してください"
            required
          />
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              {stars.map((value) => {
                const filled = rating !== null && value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value}つ星`}
                    onClick={() => setRating(value)}
                    className="rounded-lg p-1.5 transition hover:scale-105 active:scale-95"
                  >
                    <Star
                      className={cn(
                        "h-11 w-11",
                        filled ? "fill-[#fbbc04] text-[#fbbc04]" : "text-zinc-300",
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            {rating ? (
              <p className="mt-2 text-center text-[13px] font-medium text-zinc-600">
                {rating}つ星
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-3 border-t border-zinc-200/80 pt-7">
          <SectionHeader
            step={2}
            title="今回のマシンピラティス体験はいかがでしたか？"
            required
          />
          <ChoiceGrid
            multi
            options={EXPERIENCE_OPTIONS}
            selected={experience}
            onToggle={(opt) => setExperience((prev) => toggleMulti(prev, opt))}
          />
          {needsExperienceOther ? (
            <Input
              value={experienceOther}
              onChange={(e) => setExperienceOther(e.target.value)}
              className={memberFormInputClass}
              placeholder="その他の内容を入力"
            />
          ) : null}
        </section>

        <section className="space-y-3 border-t border-zinc-200/80 pt-7">
          <SectionHeader
            step={3}
            title="体験のキッカケを教えてください"
            required
          />
          <ChoiceGrid
            multi
            options={TRIGGER_OPTIONS}
            selected={triggers}
            onToggle={(opt) => setTriggers((prev) => toggleMulti(prev, opt))}
          />
          {needsInstagram ? (
            <div className="space-y-2 rounded-2xl border border-[color:var(--joyfit-red)]/20 bg-[color:var(--joyfit-red)]/5 p-4">
              <p className="text-[13px] font-semibold text-zinc-800">
                どちらのアカウントで知りましたか？
                <span className="ml-1 text-[10px] font-bold text-[color:var(--joyfit-red)]">必須</span>
              </p>
              <ChoiceGrid
                multi
                options={INSTAGRAM_ACCOUNT_OPTIONS}
                selected={instagramAccounts}
                onToggle={(opt) => setInstagramAccounts((prev) => toggleMulti(prev, opt))}
              />
            </div>
          ) : null}
          {needsTriggerOther ? (
            <Input
              value={triggerOther}
              onChange={(e) => setTriggerOther(e.target.value)}
              className={memberFormInputClass}
              placeholder="その他の内容を入力"
            />
          ) : null}
        </section>

        <section className="space-y-3 border-t border-zinc-200/80 pt-7">
          <SectionHeader
            step={4}
            title="今後体験してみたいイベントは？"
            required
          />
          <ChoiceGrid
            multi
            options={FUTURE_EVENT_OPTIONS}
            selected={futureEvents}
            onToggle={(opt) => setFutureEvents((prev) => toggleMulti(prev, opt))}
          />
          {needsPilatesMinutes ? (
            <div className="flex items-center gap-2">
              <p className="shrink-0 text-[13px] font-medium text-zinc-700">ピラティス希望時間</p>
              <Input
                value={pilatesMinutes}
                onChange={(e) => setPilatesMinutes(e.target.value.replace(/[^\d]/g, ""))}
                className={`${memberFormInputClass} max-w-[7rem]`}
                inputMode="numeric"
                placeholder="30"
              />
              <span className="text-[13px] text-zinc-500">分くらい</span>
            </div>
          ) : null}
          {needsYogaMinutes ? (
            <div className="flex items-center gap-2">
              <p className="shrink-0 text-[13px] font-medium text-zinc-700">ヨガ希望時間</p>
              <Input
                value={yogaMinutes}
                onChange={(e) => setYogaMinutes(e.target.value.replace(/[^\d]/g, ""))}
                className={`${memberFormInputClass} max-w-[7rem]`}
                inputMode="numeric"
                placeholder="45"
              />
              <span className="text-[13px] text-zinc-500">分くらい</span>
            </div>
          ) : null}
          {needsFutureOther ? (
            <Input
              value={futureEventOther}
              onChange={(e) => setFutureEventOther(e.target.value)}
              className={memberFormInputClass}
              placeholder="その他の内容を入力"
            />
          ) : null}
        </section>

        <section className="space-y-3 border-t border-zinc-200/80 pt-7">
          <SectionHeader
            step={5}
            title="普段、体のお悩みはありますか？"
            required
          />
          <ChoiceGrid
            multi
            options={CONCERN_OPTIONS}
            selected={concerns}
            onToggle={(opt) => setConcerns((prev) => toggleMulti(prev, opt))}
          />
          {needsConcernOther ? (
            <Input
              value={concernOther}
              onChange={(e) => setConcernOther(e.target.value)}
              className={memberFormInputClass}
              placeholder="その他の内容を入力"
            />
          ) : null}
        </section>

        <section className="space-y-3 border-t border-zinc-200/80 pt-7">
          <SectionHeader
            step={6}
            title="スタジオでの本格レッスンに興味はありますか？"
            required
          />
          <div className="grid gap-2">
            {INTEREST_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={memberFormChoiceClass(interest === opt)}
                onClick={() => setInterest(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t border-zinc-200/80 pt-7">
          <SectionHeader step={7} title="本日の感想" />
          <Textarea
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            rows={4}
            className={memberFormTextareaClass}
            placeholder="例: 初めてでも分かりやすく楽しめました"
          />
        </section>

        <section className="space-y-4 border-t border-zinc-200/80 pt-7">
          <SectionHeader step={8} title="今後のご案内" />
          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-zinc-800">お名前</p>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={memberFormInputClass}
                placeholder="山田 花子"
                autoComplete="name"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-zinc-800">ご年齢</p>
              <div className="flex items-center gap-2">
                <Input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
                  className={`${memberFormInputClass} max-w-[7rem]`}
                  inputMode="numeric"
                  placeholder="35"
                />
                <span className="text-[13px] text-zinc-500">歳</span>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-zinc-800">メールアドレス</p>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={memberFormInputClass}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="example@email.com"
                aria-invalid={emailInvalid}
              />
              {emailInvalid ? (
                <p className="mt-1.5 text-[12px] font-medium text-[color:var(--joyfit-red)]">
                  メールアドレスの形式をご確認ください
                </p>
              ) : null}
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-zinc-800">ご住所</p>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={memberFormInputClass}
                autoComplete="street-address"
                placeholder="任意"
              />
            </div>
          </div>
        </section>

        {submitError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
            {submitError}
          </p>
        ) : null}

        <div className="pb-2">
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || submitting}
            className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {submitting
              ? "送信中…"
              : rating !== null && rating >= 4
                ? "送信してGoogle口コミへ"
                : "送信する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
