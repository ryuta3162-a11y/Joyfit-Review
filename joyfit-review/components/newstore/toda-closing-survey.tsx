"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Star } from "lucide-react";

import { submitTodaClosingSurvey } from "@/app/actions/submit-toda-closing-survey";
import { warmupClosingSurveyGas } from "@/app/actions/warmup-closing-survey-gas";
import {
  memberFormChoiceClass,
  memberFormErrorClass,
  memberFormHintClass,
  memberFormInputClass,
  memberFormTextareaClass,
} from "@/components/member/member-form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { brandCssVars, BRAND_THEMES } from "@/lib/brand";
import {
  REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL,
  REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL,
  SURVEY_COMPLETION_THANK_YOU,
  getHighRatingGoogleMapHint,
} from "@/lib/member-reward-copy";
import {
  AGE_OPTIONS,
  APP_SECTION_TITLE,
  buildTodaReviewDraft,
  DRAFT_FIELD_TITLE,
  DRAFT_PLACEHOLDER,
  EXTRA_COMMENT_TITLE,
  GENDER_OPTIONS,
  GYM_EXPERIENCE_OPTIONS,
  HOW_FOUND_OPTIONS,
  JOIN_OPTIONS,
  JOIN_QUESTION_TITLE,
  MAX_REVIEW_POSITIVES,
  PAGE_TITLE,
  PHONE_ERROR,
  PHONE_FIELD_TITLE,
  PHONE_HINT,
  PHONE_PLACEHOLDER,
  RATING_HINT,
  RATING_QUESTION,
  REVIEW_POSITIVE_OPTIONS,
  REVIEW_POSITIVES_HINT,
  REVIEW_POSITIVES_TITLE,
  STUDENT_TOGGLE_LABEL,
  SUCCESS_DRAFT_LABEL,
  SUCCESS_GOOGLE_GUIDE,
  SUCCESS_SAVED,
  toggleLimited,
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

function digitsOnly(value: string): string {
  return value
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, "")
    .slice(0, 11);
}

function isPhoneComplete(value: string): boolean {
  return value.length === 10 || value.length === 11;
}

function handlePhoneKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const allowed = [
    "Backspace",
    "Delete",
    "Tab",
    "Enter",
    "Escape",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ];
  if (allowed.includes(event.key)) return;
  if (!/^\d$/.test(event.key)) event.preventDefault();
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <p className="text-[14px] font-semibold tracking-tight text-zinc-800">
        {children}
      </p>
      {required ? (
        <span className="text-[11px] font-medium text-[color:var(--joyfit-red)]">
          必須
        </span>
      ) : (
        <span className="text-[11px] font-medium text-zinc-400">任意</span>
      )}
      {hint ? (
        <span className="text-[11px] font-medium text-zinc-500">{hint}</span>
      ) : null}
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
          className={memberFormChoiceClass(value === opt)}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function RatingStars({
  rating,
  onSelect,
}: {
  rating: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {STARS.map((value) => {
        const filled = value <= rating;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className="rounded-lg p-1.5 transition hover:bg-zinc-100"
            aria-label={`${value}つ星`}
          >
            <Star
              className={`h-9 w-9 sm:h-10 sm:w-10 ${
                filled ? "fill-[#fbbc04] text-[#fbbc04]" : "text-zinc-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function VisitTypeButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "h-16 rounded-2xl text-[1.35rem] font-bold tracking-[0.18em] transition",
        selected
          ? "border border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
          : "border border-zinc-800/80 bg-white text-zinc-900 shadow-[0_4px_12px_rgba(24,24,27,0.08)] hover:-translate-y-0.5",
      )}
    >
      {label}
    </button>
  );
}

function PageHeader({ store }: { store: ClosingStore }) {
  return (
    <div className="px-2 pb-8 pt-4 text-center text-white">
      <div className="relative z-[1] mx-auto flex justify-center">
        {store.brand === "fit365" ? (
          <div className="w-[8.75rem] drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)]">
            <Image
              src="/fit365-bear-sign.png"
              alt="FIT365 ベアクマ"
              width={353}
              height={293}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        ) : (
          <div className="w-[11.5rem] drop-shadow-[0_8px_16px_rgba(0,0,0,0.28)]">
            <Image
              src="/joyfit-logo-mark.png"
              alt="JOYFIT24"
              width={579}
              height={122}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        )}
      </div>
      <h1 className="relative z-[1] mt-5 text-[1.55rem] font-bold tracking-tight [text-shadow:0_2px_0_rgba(0,0,0,0.2),0_10px_18px_rgba(0,0,0,0.22)]">
        {PAGE_TITLE}
      </h1>
      <p className="relative z-[1] mt-3 inline-flex rounded-full bg-white px-4 py-1.5 text-[13px] font-bold text-[color:var(--joyfit-red)] shadow-[0_8px_18px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)]">
        {store.name}
      </p>
    </div>
  );
}

export function TodaClosingSurvey({ store }: Props) {
  const theme = BRAND_THEMES[store.brand];
  const brandVars = useMemo(() => brandCssVars(theme), [theme]);
  const googleReviewUrl = store.googleReviewUrl.trim();
  const canPostGoogle = Boolean(googleReviewUrl);
  const submissionIdRef = useRef(newSubmissionId());

  const [visitType, setVisitType] = useState<TodaVisitType | null>(null);
  const [fullName, setFullName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [isStudent, setIsStudent] = useState(false);
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
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void warmupClosingSurveyGas();
  }, []);

  const emailTrimmed = email.trim();
  const emailInvalid =
    Boolean(emailTrimmed) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const phoneInvalid = phone.length > 0 && !isPhoneComplete(phone);
  const needsHowFoundOther = howFound === "その他";

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
    isPhoneComplete(phone) &&
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

  function selectVisitType(next: TodaVisitType) {
    setVisitType(next);
    if (next !== "taiken") setJoinIntent("");
  }

  function handleSubmit() {
    if (!formReady || visitType === null || rating === null || sent) return;

    const generatedReview = shownDraft.trim();
    setDraft(generatedReview);
    setSent(true);
    try {
      void navigator.clipboard.writeText(generatedReview);
    } catch {
      /* ignore */
    }
    if (rating >= 4 && googleReviewUrl) {
      window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
    }

    void submitTodaClosingSurvey({
      storeId: store.id,
      storeName: store.name,
      visitType,
      fullName,
      furigana,
      phone,
      email: emailTrimmed,
      gender,
      age,
      university: isStudent ? university : "",
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
  }

  if (sent) {
    const goGoogle = rating !== null && rating >= 4 && canPostGoogle;
    return (
      <div data-brand={store.brand} style={brandVars}>
        <div className="px-2 pb-8 pt-8 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 shadow-[0_8px_18px_rgba(0,0,0,0.16)]">
            <Check className="h-7 w-7" strokeWidth={2.75} />
          </div>
          <h2 className="mt-6 text-[22px] font-bold tracking-tight [text-shadow:0_2px_0_rgba(0,0,0,0.18)]">
            {SURVEY_COMPLETION_THANK_YOU}
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-white/90">
            {SUCCESS_SAVED}
          </p>
        </div>
        <div className="space-y-5 rounded-[1.75rem] bg-white px-5 py-7 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          {shownDraft ? (
            <div className="text-left">
              <p className="mb-2 text-[13px] font-semibold text-zinc-700">
                {SUCCESS_DRAFT_LABEL}
              </p>
              <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800/75 bg-white px-4 py-3 text-[13px] leading-relaxed text-zinc-800">
                {shownDraft}
              </pre>
              {goGoogle && rating !== null ? (
                <>
                  <p className="mt-3 text-center text-[13px] leading-relaxed text-zinc-500">
                    {SUCCESS_GOOGLE_GUIDE}
                    <br />
                    {getHighRatingGoogleMapHint(rating)}
                  </p>
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white transition hover:bg-[color:var(--joyfit-red-dark)]"
                  >
                    {REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL}
                  </a>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-zinc-800/75 bg-white p-4 text-left">
            <p className="text-[14px] font-semibold text-zinc-900">
              {APP_SECTION_TITLE}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">
              {store.appInstallBody}
            </p>
            <a
              href={store.appInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-[13px] font-semibold text-[color:var(--joyfit-red)] underline underline-offset-2"
            >
              {store.appInstallLinkLabel}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-brand={store.brand} style={brandVars}>
      <PageHeader store={store} />

      <div className="space-y-5 rounded-[1.75rem] bg-white px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-2 gap-3">
          <VisitTypeButton
            label="見学"
            selected={visitType === "kengaku"}
            onClick={() => selectVisitType("kengaku")}
          />
          <VisitTypeButton
            label="体験"
            selected={visitType === "taiken"}
            onClick={() => selectVisitType("taiken")}
          />
        </div>

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
            autoCorrect="off"
            spellCheck={false}
            placeholder="ヤマダ ハナコ"
          />
        </section>
        <section className="space-y-2">
          <FieldLabel required hint={PHONE_HINT}>
            {PHONE_FIELD_TITLE}
          </FieldLabel>
          <Input
            value={phone}
            onChange={(e) => setPhone(digitsOnly(e.target.value))}
            onKeyDown={handlePhoneKeyDown}
            className={memberFormInputClass}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={11}
            autoComplete="tel-national"
            placeholder={PHONE_PLACEHOLDER}
            aria-invalid={phoneInvalid}
          />
          {phoneInvalid ? (
            <p className={memberFormErrorClass}>{PHONE_ERROR}</p>
          ) : null}
        </section>
        <section className="space-y-2">
          <FieldLabel required>メールアドレス</FieldLabel>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={memberFormInputClass}
            type="email"
            inputMode="email"
            name="closing-email"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="example@email.com"
            aria-invalid={emailInvalid}
          />
          {emailInvalid ? (
            <p className={memberFormErrorClass}>
              メールアドレスの形式をご確認ください
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <FieldLabel required>性別</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={memberFormChoiceClass(gender === opt)}
                onClick={() => setGender(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <FieldLabel required>ご年齢</FieldLabel>
          <ChoiceWrap options={AGE_OPTIONS} value={age} onChange={setAge} />
          <button
            type="button"
            className={memberFormChoiceClass(isStudent)}
            onClick={() => {
              setIsStudent((prev) => {
                const next = !prev;
                if (!next) setUniversity("");
                return next;
              });
            }}
          >
            {STUDENT_TOGGLE_LABEL}
          </button>
          {isStudent ? (
            <Input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className={memberFormInputClass}
              autoComplete="off"
              placeholder="大学名（任意）"
            />
          ) : null}
        </section>

        <section className="space-y-2">
          <FieldLabel required>ジムのご利用経験について</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {GYM_EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={cn(
                  memberFormChoiceClass(gymExperience === opt),
                  "min-h-12 px-2 text-center text-[12px] leading-snug",
                )}
                onClick={() => setGymExperience(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <FieldLabel required>当クラブをどこでお知りになりましたか？</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {HOW_FOUND_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={memberFormChoiceClass(howFound === opt)}
                onClick={() => setHowFound(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          {needsHowFoundOther ? (
            <Input
              value={howFoundOther}
              onChange={(e) => setHowFoundOther(e.target.value)}
              className={memberFormInputClass}
              autoComplete="off"
              placeholder="その他の回答"
            />
          ) : null}
        </section>

        {visitType === "taiken" ? (
          <section className="space-y-2">
            <FieldLabel required>{JOIN_QUESTION_TITLE}</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {JOIN_OPTIONS.map((opt) => (
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

        <section className="space-y-2 border-t border-zinc-100 pt-6">
          <div className="space-y-1">
            <FieldLabel required>{REVIEW_POSITIVES_TITLE}</FieldLabel>
            <p className={memberFormHintClass}>
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
                  className={memberFormChoiceClass(active)}
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

        <section className="space-y-2 text-center">
          <FieldLabel required>{RATING_QUESTION}</FieldLabel>
          <p className={memberFormHintClass}>{RATING_HINT}</p>
          <RatingStars rating={rating ?? 0} onSelect={setRating} />
        </section>

        <section className="space-y-2">
          <FieldLabel>{DRAFT_FIELD_TITLE}</FieldLabel>
          <Textarea
            value={shownDraft}
            onChange={(e) => {
              setDraftTouched(true);
              setDraft(e.target.value);
            }}
            rows={5}
            className={memberFormTextareaClass}
            autoComplete="off"
            placeholder={DRAFT_PLACEHOLDER}
          />
        </section>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!formReady}
          className="h-12 w-full rounded-2xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          {REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL}
        </Button>
      </div>
    </div>
  );
}
