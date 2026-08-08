"use client";

import { useMemo, useRef, useState } from "react";
import { Noto_Sans_JP } from "next/font/google";
import { Check, Star } from "lucide-react";

import { submitEventSurvey } from "@/app/actions/submit-event-survey";
import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import { MemberFormField } from "@/components/member/member-form-field";
import {
  memberFormBodyClass,
  memberFormCardClass,
  memberFormChoiceClass,
  memberFormInputClass,
  memberFormSectionClass,
  memberFormSectionDividerClass,
  memberFormSectionTitleClass,
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
  storeDisplayName: string;
};

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

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

export function PilatesTrialEventSurvey({ reviewUrl, storeDisplayName }: Props) {
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
  const [contact, setContact] = useState("");

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
    impression.trim().length > 0;

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
      contact,
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
      className={`${notoSansJp.className} ${memberFormCardClass} text-foreground`}
      style={brandVars}
    >
      <div className="joyfit-brand-header px-5 pb-7 pt-6 text-center text-white md:px-6 md:pt-8">
        <JoyfitHeaderLogo brand="yoga" />
        <h1 className="relative z-[1] mt-5 text-xl font-bold md:text-2xl">
          {PILATES_TRIAL_EVENT.title}
        </h1>
        <p className="relative z-[1] mt-2 text-[13px] text-white/90">
          {PILATES_TRIAL_EVENT.subtitle}
        </p>
        <p className="relative z-[1] mt-1 text-[12px] text-white/80">
          {PILATES_TRIAL_EVENT.dateLabel}
        </p>
        <p className="relative z-[1] mt-4 text-[12px] text-white/75">
          {storeDisplayName} の口コミにもつながる体験アンケートです
        </p>
      </div>

      <div className={memberFormBodyClass}>
        <section className={memberFormSectionClass}>
          <p className={memberFormSectionTitleClass}>
            今回のマシンピラティス体験を星の数で評価してください
            <span className="text-[color:var(--joyfit-red)]"> *</span>
          </p>
          <p className="text-[12px] text-zinc-500">低評価 ← → 高評価（タップで黄色になります）</p>
          <div className="flex items-center justify-center gap-2 py-2">
            {stars.map((value) => {
              const filled = rating !== null && value <= rating;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value}つ星`}
                  onClick={() => setRating(value)}
                  className="rounded-lg p-1 transition hover:scale-105"
                >
                  <Star
                    className={cn(
                      "h-10 w-10",
                      filled ? "fill-[#fbbc04] text-[#fbbc04]" : "text-zinc-300",
                    )}
                    strokeWidth={1.5}
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section className={memberFormSectionDividerClass}>
          <p className={memberFormSectionTitleClass}>
            今回のマシンピラティス体験はいかがでしたか？
            <span className="text-[color:var(--joyfit-red)]"> *</span>
          </p>
          <p className="text-[12px] text-zinc-500">複数選択可</p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={memberFormTagClass(experience.includes(opt))}
                onClick={() => setExperience((prev) => toggleMulti(prev, opt))}
              >
                {opt}
              </button>
            ))}
          </div>
          {needsExperienceOther ? (
            <MemberFormField label="その他の内容" required>
              <Input
                value={experienceOther}
                onChange={(e) => setExperienceOther(e.target.value)}
                className={memberFormInputClass}
                placeholder="自由にご記入ください"
              />
            </MemberFormField>
          ) : null}
        </section>

        <section className={memberFormSectionDividerClass}>
          <p className={memberFormSectionTitleClass}>
            今回体験を受けてくださったキッカケを教えてください
            <span className="text-[color:var(--joyfit-red)]"> *</span>
          </p>
          <p className="text-[12px] text-zinc-500">複数選択可</p>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={memberFormTagClass(triggers.includes(opt))}
                onClick={() => setTriggers((prev) => toggleMulti(prev, opt))}
              >
                {opt}
              </button>
            ))}
          </div>
          {needsInstagram ? (
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-[13px] font-semibold text-zinc-800">
                どちらのアカウントで知りましたか？
                <span className="text-[color:var(--joyfit-red)]"> *</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {INSTAGRAM_ACCOUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={memberFormChoiceClass(instagramAccounts.includes(opt))}
                    onClick={() => setInstagramAccounts((prev) => toggleMulti(prev, opt))}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {needsTriggerOther ? (
            <MemberFormField label="その他の内容" required>
              <Input
                value={triggerOther}
                onChange={(e) => setTriggerOther(e.target.value)}
                className={memberFormInputClass}
                placeholder="自由にご記入ください"
              />
            </MemberFormField>
          ) : null}
        </section>

        <section className={memberFormSectionDividerClass}>
          <p className={memberFormSectionTitleClass}>
            今後体験してみたいイベントを教えてください
            <span className="text-[color:var(--joyfit-red)]"> *</span>
          </p>
          <p className="text-[12px] text-zinc-500">複数選択可</p>
          <div className="flex flex-wrap gap-2">
            {FUTURE_EVENT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={memberFormTagClass(futureEvents.includes(opt))}
                onClick={() => setFutureEvents((prev) => toggleMulti(prev, opt))}
              >
                {opt}
              </button>
            ))}
          </div>
          {needsPilatesMinutes ? (
            <MemberFormField label="マシンピラティス体験の希望時間" hint="分程度">
              <Input
                value={pilatesMinutes}
                onChange={(e) => setPilatesMinutes(e.target.value.replace(/[^\d]/g, ""))}
                className={memberFormInputClass}
                inputMode="numeric"
                placeholder="例: 30"
              />
            </MemberFormField>
          ) : null}
          {needsYogaMinutes ? (
            <MemberFormField label="ヨガ体験の希望時間" hint="分程度">
              <Input
                value={yogaMinutes}
                onChange={(e) => setYogaMinutes(e.target.value.replace(/[^\d]/g, ""))}
                className={memberFormInputClass}
                inputMode="numeric"
                placeholder="例: 45"
              />
            </MemberFormField>
          ) : null}
          {needsFutureOther ? (
            <MemberFormField label="その他の内容" required>
              <Input
                value={futureEventOther}
                onChange={(e) => setFutureEventOther(e.target.value)}
                className={memberFormInputClass}
                placeholder="自由にご記入ください"
              />
            </MemberFormField>
          ) : null}
        </section>

        <section className={memberFormSectionDividerClass}>
          <p className={memberFormSectionTitleClass}>
            普段、体のお悩みや気になっていることはありますか？
            <span className="text-[color:var(--joyfit-red)]"> *</span>
          </p>
          <p className="text-[12px] text-zinc-500">複数選択可</p>
          <div className="flex flex-wrap gap-2">
            {CONCERN_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={memberFormTagClass(concerns.includes(opt))}
                onClick={() => setConcerns((prev) => toggleMulti(prev, opt))}
              >
                {opt}
              </button>
            ))}
          </div>
          {needsConcernOther ? (
            <MemberFormField label="その他の内容" required>
              <Input
                value={concernOther}
                onChange={(e) => setConcernOther(e.target.value)}
                className={memberFormInputClass}
                placeholder="自由にご記入ください"
              />
            </MemberFormField>
          ) : null}
        </section>

        <section className={memberFormSectionDividerClass}>
          <p className={memberFormSectionTitleClass}>
            本格的なレッスンや、スタジオでの体験に興味はありますか？
            <span className="text-[color:var(--joyfit-red)]"> *</span>
          </p>
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

        <section className={memberFormSectionDividerClass}>
          <MemberFormField label="本日の感想を教えてください" required>
            <Textarea
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              rows={5}
              className={memberFormTextareaClass}
              placeholder="ご自由にお書きください"
            />
          </MemberFormField>
        </section>

        <section className={memberFormSectionDividerClass}>
          <p className={memberFormSectionTitleClass}>差し支えなければご記入ください（任意）</p>
          <p className="text-[12px] leading-relaxed text-zinc-500">
            今後のご案内（キャンペーン情報・特典等）のため
          </p>
          <MemberFormField label="お名前">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={memberFormInputClass}
              placeholder="山田 花子"
            />
          </MemberFormField>
          <MemberFormField label="ご年齢">
            <Input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={memberFormInputClass}
              placeholder="例: 35"
            />
          </MemberFormField>
          <MemberFormField label="ご連絡先（ご住所 or メールアドレス）">
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className={memberFormInputClass}
              placeholder="メールアドレスまたは住所"
            />
          </MemberFormField>
        </section>

        {submitError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
            {submitError}
          </p>
        ) : null}

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
              : "アンケートを送信する"}
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-zinc-500">
          高評価の場合は、Google口コミページを開きます（口コミ文面を自動作成します）。
        </p>
      </div>
    </div>
  );
}
