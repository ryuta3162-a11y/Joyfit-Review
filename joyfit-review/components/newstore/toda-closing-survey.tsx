"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Star } from "lucide-react";

import { submitTodaClosingSurvey } from "@/app/actions/submit-toda-closing-survey";
import { Fit365Mascot } from "@/components/joyfit/fit365-mascot";
import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import {
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
  AGE_OPTIONS,
  APP_SECTION_TITLE,
  buildTodaReviewDraft,
  EXTRA_COMMENT_TITLE,
  FORM_NOTE,
  GENDER_OPTIONS,
  GYM_EXPERIENCE_OPTIONS,
  HOW_FOUND_OPTIONS,
  isStudentAge,
  JOIN_OPTIONS_CAMPAIGN,
  JOIN_OPTIONS_DEFAULT,
  JOIN_QUESTION_CAMPAIGN_LINES,
  JOIN_QUESTION_NOTE,
  JOIN_QUESTION_TITLE,
  LANDING_PLEASE,
  LANDING_THANKS,
  MAX_REVIEW_POSITIVES,
  PAGE_TITLE,
  PRIVACY_NOTE,
  RATING_HINT,
  RATING_QUESTION,
  REVIEW_POSITIVE_OPTIONS,
  REVIEW_POSITIVES_HINT,
  REVIEW_POSITIVES_TITLE,
  TAIKEN_HOURS,
  toggleLimited,
  VISIT_TYPE_LABEL,
  type ClosingStore,
  type TodaVisitType,
} from "@/lib/newstore/toda-closing";
import { cn } from "@/lib/utils";

type Props = {
  store: ClosingStore;
};

const STARS = [1, 2, 3, 4, 5] as const;

function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `toda-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-[14px] font-semibold tracking-tight text-zinc-900">
        {children}
      </p>
      {required ? (
        <span className="rounded-full bg-[color:var(--joyfit-red)]/10 px-2 py-0.5 text-[10px] font-bold text-[color:var(--joyfit-red)]">
          必須
        </span>
      ) : (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
          任意
        </span>
      )}
    </div>
  );
}

function ChoiceWrap({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={memberFormTagClass(value === opt)}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (next: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-5">
      <div className="flex items-center justify-center gap-1.5">
        {STARS.map((star) => {
          const filled = value !== null && star <= value;
          return (
            <button
              key={star}
              type="button"
              aria-label={`${star}つ星`}
              onClick={() => onChange(star)}
              className="rounded-lg p-1 transition hover:scale-105 active:scale-95"
            >
              <Star
                className={cn(
                  "h-10 w-10",
                  filled ? "fill-[#fbbc04] text-[#fbbc04]" : "text-zinc-300",
                )}
                strokeWidth={1.4}
              />
            </button>
          );
        })}
      </div>
      {value ? (
        <p className="mt-2 text-center text-[13px] font-medium text-zinc-600">
          星{value}
        </p>
      ) : null}
    </div>
  );
}

function PageHeader({
  store,
  subtitle,
}: {
  store: ClosingStore;
  subtitle?: string;
}) {
  return (
    <div className="joyfit-brand-header px-6 pb-7 pt-5 text-center text-white">
      <div className="relative z-[1] mx-auto w-full max-w-[16.5rem]">
        {store.brand === "fit365" ? (
          <Fit365Mascot priority className="h-auto w-full object-contain" />
        ) : (
          <JoyfitHeaderLogo brand={store.brand} className="py-2" />
        )}
      </div>
      <h1 className="relative z-[1] mt-4 text-[1.35rem] font-bold tracking-tight">
        {PAGE_TITLE}
      </h1>
      <p className="relative z-[1] mt-1.5 text-[12px] text-white/85">
        {subtitle ?? store.name}
      </p>
    </div>
  );
}

export function TodaClosingSurvey({ store }: Props) {
  const theme = BRAND_THEMES[store.brand];
  const brandVars = useMemo(() => brandCssVars(theme), [theme]);
  const googleReviewUrl = store.googleReviewUrl;
  const joinOptions = store.showJoinCampaign ? JOIN_OPTIONS_CAMPAIGN : JOIN_OPTIONS_DEFAULT;
  const submissionIdRef = useRef(newSubmissionId());

  const [visitType, setVisitType] = useState<TodaVisitType | null>(null);
  const [fullName, setFullName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [university, setUniversity] = useState("");
  const [gymExperience, setGymExperience] = useState("");
  const [howFound, setHowFound] = useState("");
  const [howFoundOther, setHowFoundOther] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [joinIntent, setJoinIntent] = useState("");
  const [extraComment, setExtraComment] = useState("");
  const [positives, setPositives] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftTouched, setDraftTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const emailTrimmed = email.trim();
  const emailInvalid =
    Boolean(emailTrimmed) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const needsHowFoundOther = howFound === "その他";
  const showUniversity = isStudentAge(age);

  const liveDraft = useMemo(() => {
    if (!visitType) return "";
    return buildTodaReviewDraft({
      storeName: store.name,
      visitType,
      positives,
      extraComment,
      rating: rating ?? 0,
    });
  }, [store.name, visitType, positives, extraComment, rating]);

  const shownDraft = draftTouched ? draft : liveDraft;

  const formReady =
    visitType !== null &&
    fullName.trim() &&
    furigana.trim() &&
    phone.trim() &&
    emailTrimmed &&
    !emailInvalid &&
    Boolean(gender) &&
    Boolean(age) &&
    Boolean(gymExperience) &&
    Boolean(howFound) &&
    (!needsHowFoundOther || howFoundOther.trim()) &&
    rating !== null &&
    (visitType === "kengaku" || Boolean(joinIntent)) &&
    positives.length > 0;

  function handleAge(next: string) {
    setAge(next);
    if (!isStudentAge(next)) setUniversity("");
  }

  function resetVisitType() {
    setVisitType(null);
    setJoinIntent("");
    setSent(false);
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (!formReady || visitType === null || rating === null) return;
    if (submitting || sent) return;
    setSubmitting(true);
    setSubmitError(null);

    const generatedReview = shownDraft.trim();
    const result = await submitTodaClosingSurvey({
      storeId: store.id,
      storeName: store.name,
      visitType,
      fullName,
      furigana,
      phone,
      email: emailTrimmed,
      gender,
      age,
      university: showUniversity ? university : "",
      gymExperience,
      howFound,
      howFoundOther: needsHowFoundOther ? howFoundOther : "",
      rating,
      joinIntent: visitType === "taiken" ? joinIntent : "",
      extraComment,
      positives,
      generatedReview,
      submissionId: submissionIdRef.current,
    });

    if (!result.ok) {
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    setDraft(generatedReview);
    if (rating >= 4 && googleReviewUrl.trim()) {
      try {
        await navigator.clipboard.writeText(generatedReview);
      } catch {
        /* ignore */
      }
      window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
    }
    setSent(true);
    setSubmitting(false);
  }

  if (!visitType) {
    return (
      <div data-brand={store.brand} className={memberFormCardClass} style={brandVars}>
        <PageHeader store={store} />
        <div className="space-y-5 bg-gradient-to-b from-zinc-50/80 to-white px-5 py-7 md:px-7">
          <div className="space-y-2 text-center">
            <p className="text-[14px] leading-relaxed text-zinc-700">{LANDING_THANKS}</p>
            <p className="text-[13px] leading-relaxed text-zinc-500">{LANDING_PLEASE}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setVisitType("kengaku")}
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-6 text-left shadow-[0_1px_8px_rgba(24,24,27,0.04)] transition hover:border-[color:var(--joyfit-red)]/40 hover:shadow-md"
            >
              <span className="text-[11px] font-semibold tracking-[0.18em] text-zinc-400">
                VISIT
              </span>
              <span className="mt-1.5 block text-[1.15rem] font-bold text-zinc-900">
                見学
              </span>
              <span className="mt-1 block text-[12px] leading-relaxed text-zinc-500">
                施設のご案内を受けた方
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVisitType("taiken")}
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-6 text-left shadow-[0_1px_8px_rgba(24,24,27,0.04)] transition hover:border-[color:var(--joyfit-red)]/40 hover:shadow-md"
            >
              <span className="text-[11px] font-semibold tracking-[0.18em] text-zinc-400">
                TRIAL
              </span>
              <span className="mt-1.5 block text-[1.15rem] font-bold text-zinc-900">
                無料体験
              </span>
              <span className="mt-1 block text-[12px] leading-relaxed text-zinc-500">
                体験トレーニングをされた方
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sent) {
    const goGoogle = rating !== null && rating >= 4 && googleReviewUrl.trim();
    return (
      <div data-brand={store.brand} className={memberFormCardClass} style={brandVars}>
        <div className="joyfit-brand-header px-6 pb-10 pt-12 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <Check className="h-7 w-7" strokeWidth={2.75} />
          </div>
          <h2 className="mt-7 text-[22px] font-bold tracking-tight">
            ご協力ありがとうございます
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-white/90">
            {goGoogle
              ? "口コミ文をコピーしました。Googleマップへ投稿をお願いします。"
              : "ご入力完了後にスタッフをお呼びください。"}
          </p>
        </div>
        <div className="px-6 py-8 text-center">
          {goGoogle && shownDraft ? (
            <div className="mx-auto max-w-sm text-left">
              <p className="mb-2 text-[13px] font-semibold text-zinc-700">
                口コミ文面（コピー済み）
              </p>
              <pre className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-zinc-800">
                {shownDraft}
              </pre>
              <p className="mt-3 text-[12px] leading-relaxed text-zinc-500">
                Googleマップでも星{rating}の評価を選択してください。
              </p>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white transition hover:bg-[color:var(--joyfit-red-dark)]"
              >
                Google口コミを投稿する
              </a>
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed text-zinc-600">
              貴重なご意見を今後の参考にさせていただきます。
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-brand={store.brand} className={memberFormCardClass} style={brandVars}>
      <PageHeader store={store} subtitle={`${store.name} ／ ${VISIT_TYPE_LABEL[visitType]}`} />

      <div className="space-y-6 bg-gradient-to-b from-zinc-50/80 to-white px-5 py-6 md:px-7">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] leading-relaxed text-zinc-600">{FORM_NOTE}</p>
          <button
            type="button"
            onClick={resetVisitType}
            className="shrink-0 text-[11px] font-semibold text-zinc-400 underline underline-offset-2"
          >
            選び直す
          </button>
        </div>
        {visitType === "taiken" && store.showTrialHours ? (
          <p className="rounded-xl bg-zinc-100/80 px-3 py-2 text-[12px] leading-relaxed text-zinc-500">
            {TAIKEN_HOURS}
          </p>
        ) : null}

        <section className="space-y-2">
          <FieldLabel required>お名前 (フルネーム)</FieldLabel>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={memberFormInputClass}
            autoComplete="name"
            placeholder="山田 花子"
          />
        </section>

        <section className="space-y-2">
          <FieldLabel required>フリガナ</FieldLabel>
          <Input
            value={furigana}
            onChange={(e) => setFurigana(e.target.value)}
            className={memberFormInputClass}
            autoComplete="off"
            placeholder="ヤマダ ハナコ"
          />
        </section>

        <section className="space-y-2">
          <FieldLabel required>ご連絡先 (電話番号)</FieldLabel>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={memberFormInputClass}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09012345678"
          />
        </section>

        <section className="space-y-2">
          <FieldLabel required>メールアドレス</FieldLabel>
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
            <p className="text-[12px] font-medium text-[color:var(--joyfit-red)]">
              メールアドレスの形式をご確認ください
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <FieldLabel required>性別</FieldLabel>
          <ChoiceWrap options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        </section>

        <section className="space-y-2">
          <FieldLabel required>ご年齢</FieldLabel>
          <ChoiceWrap options={AGE_OPTIONS} value={age} onChange={handleAge} />
        </section>

        {showUniversity ? (
          <section className="space-y-2">
            <FieldLabel>大学名を教えてください</FieldLabel>
            <Input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className={memberFormInputClass}
              placeholder="任意"
            />
          </section>
        ) : null}

        <section className="space-y-2">
          <FieldLabel required>ジムのご利用経験について</FieldLabel>
          <div className="grid gap-2">
            {GYM_EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={memberFormChoiceClass(gymExperience === opt)}
                onClick={() => setGymExperience(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <FieldLabel required>当クラブをどこでお知りになりましたか？</FieldLabel>
          <ChoiceWrap options={HOW_FOUND_OPTIONS} value={howFound} onChange={setHowFound} />
          {needsHowFoundOther ? (
            <Input
              value={howFoundOther}
              onChange={(e) => setHowFoundOther(e.target.value)}
              className={memberFormInputClass}
              placeholder="その他の回答"
            />
          ) : null}
        </section>

        {visitType === "taiken" ? (
          <section className="space-y-3">
            <div className="space-y-1">
              <FieldLabel required>{JOIN_QUESTION_TITLE}</FieldLabel>
              {store.showJoinCampaign
                ? JOIN_QUESTION_CAMPAIGN_LINES.map((line) => (
                    <p key={line} className="text-[13px] font-semibold text-zinc-800">
                      {line}
                    </p>
                  ))
                : null}
              {store.showJoinCampaign ? (
                <p className="text-[12px] text-zinc-500">{JOIN_QUESTION_NOTE}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              {joinOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={memberFormChoiceClass(joinIntent === opt)}
                  onClick={() => setJoinIntent(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-2">
          <FieldLabel>{EXTRA_COMMENT_TITLE}</FieldLabel>
          <Textarea
            value={extraComment}
            onChange={(e) => setExtraComment(e.target.value)}
            rows={3}
            className={memberFormTextareaClass}
            placeholder="任意"
          />
        </section>

        <section className="space-y-2 rounded-2xl border border-zinc-200/80 bg-white p-4">
          <p className="text-[14px] font-semibold text-zinc-900">{APP_SECTION_TITLE}</p>
          <p className="text-[13px] leading-relaxed text-zinc-600">{store.appInstallBody}</p>
          <a
            href={store.appInstallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-[13px] font-semibold text-[color:var(--joyfit-red)] underline underline-offset-2"
          >
            {store.appInstallLinkLabel}
          </a>
        </section>

        <section className="space-y-3 border-t border-zinc-200/80 pt-6">
          <div className="space-y-1">
            <FieldLabel required>{REVIEW_POSITIVES_TITLE}</FieldLabel>
            <p className="text-[12px] leading-relaxed text-zinc-500">
              {REVIEW_POSITIVES_HINT}（最大{MAX_REVIEW_POSITIVES}つ）
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {REVIEW_POSITIVE_OPTIONS.map((opt) => {
              const active = positives.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={active}
                  className={memberFormTagClass(active)}
                  onClick={() =>
                    setPositives((prev) =>
                      toggleLimited(prev, opt, MAX_REVIEW_POSITIVES),
                    )
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <FieldLabel required>{RATING_QUESTION}</FieldLabel>
            <p className="text-[12px] leading-relaxed text-zinc-500">{RATING_HINT}</p>
          </div>
          <StarPicker value={rating} onChange={setRating} />
        </section>

        <section className="space-y-2">
          <FieldLabel>口コミ文面（必要なら直してください）</FieldLabel>
          <Textarea
            value={shownDraft}
            onChange={(e) => {
              setDraftTouched(true);
              setDraft(e.target.value);
            }}
            rows={5}
            className={memberFormTextareaClass}
            placeholder="よかった点を選ぶと、ここに文面ができます"
          />
        </section>

        {submitError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
            {submitError}
          </p>
        ) : null}

        <div className="pb-1">
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!formReady || submitting}
            className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {submitting
              ? "送信中…"
              : rating !== null && rating >= 4
                ? "保存してGoogle口コミへ"
                : "回答を保存する"}
          </Button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-400">
            {PRIVACY_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}
