"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Smartphone, Star } from "lucide-react";

import { submitTodaClosingSurvey } from "@/app/actions/submit-toda-closing-survey";
import { CUSTOMER_SAVE_FAILED } from "@/lib/gas-webapp";
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
import { buildKyodoReviewDraft, campaignMonthLabel } from "@/lib/newstore/kyodo-review";
import {
  REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL,
  SURVEY_COMPLETION_THANK_YOU,
} from "@/lib/member-reward-copy";
import {
  AGE_OPTIONS,
  APP_INSTALL_LEAD,
  buildTodaReviewDraft,
  DRAFT_FIELD_TITLE,
  DRAFT_PLACEHOLDER,
  EXTRA_COMMENT_TITLE,
  GENDER_OPTIONS,
  GYM_EXPERIENCE_OPTIONS,
  HOW_FOUND_OPTIONS,
  HOW_FOUND_TITLE,
  KYODO_HOW_FOUND_CAMPAIGN,
  KYODO_HOW_FOUND_HINT,
  KYODO_HOW_FOUND_OPTIONS,
  KYODO_HOW_FOUND_TITLE,
  KYODO_POSITIVES_TITLE,
  KYODO_REVIEW_POSITIVE_OPTIONS,
  KYODO_TRAINING_OPTIONS,
  KYODO_TRAINING_TITLE,
  JOIN_OPTIONS,
  JOIN_PERK_AMOUNT,
  JOIN_PERK_COMBO,
  JOIN_PERK_FEE,
  JOIN_PERK_KICKER,
  JOIN_PERK_UNIT,
  KYODO_JOIN_BONUS,
  KYODO_JOIN_BONUS_KICKER,
  KYODO_JOIN_DETAIL_LABEL,
  KYODO_JOIN_DETAIL_URL,
  JOIN_QUESTION_TITLE,
  JOIN_SAME_DAY_LABEL,
  MAX_REVIEW_POSITIVES,
  PAGE_TITLE,
  PHONE_ERROR,
  PHONE_FIELD_TITLE,
  PHONE_HINT,
  PHONE_PLACEHOLDER,
  RATING_HINT,
  RATING_QUESTION,
  resolveAppInstallUrl,
  SESSION_MINUTES_HINT,
  SESSION_MINUTES_OPTIONS,
  SESSION_MINUTES_TITLE,
  REVIEW_POSITIVE_OPTIONS,
  REVIEW_POSITIVES_HINT,
  REVIEW_POSITIVES_TITLE,
  STUDENT_TOGGLE_LABEL,
  SUCCESS_DRAFT_LABEL,
  SUCCESS_GOOGLE_BUTTON_LABEL,
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
  const [appInstallUrl, setAppInstallUrl] = useState(store.appInstallIosUrl);
  const submissionIdRef = useRef(newSubmissionId());

  const [visitType, setVisitType] = useState<TodaVisitType | null>(null);
  const [fullName, setFullName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [sessionMinutes, setSessionMinutes] = useState("");
  const slimKyodo = store.slug === "kyodo";
  const [isStudent, setIsStudent] = useState(false);
  const [university, setUniversity] = useState("");
  const [gymExperience, setGymExperience] = useState("");
  const [howFound, setHowFound] = useState<string[]>([]);
  const [howFoundOther, setHowFoundOther] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [joinIntent, setJoinIntent] = useState("");
  const [extraComment, setExtraComment] = useState("");
  const [positives, setPositives] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftTouched, setDraftTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [reviewSeed, setReviewSeed] = useState(0);

  useEffect(() => {
    void warmupClosingSurveyGas();
  }, []);

  useEffect(() => {
    if (!slimKyodo) return;
    setReviewSeed(Math.floor(Math.random() * 1_000_000_000) + 1);
  }, [slimKyodo]);

  useEffect(() => {
    setAppInstallUrl(
      resolveAppInstallUrl(store, {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
      }),
    );
  }, [store]);

  const emailTrimmed = email.trim();
  const emailInvalid =
    Boolean(emailTrimmed) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const phoneInvalid = phone.length > 0 && !isPhoneComplete(phone);
  const needsHowFoundOther = howFound.includes("その他");

  const reviewHowFound = useMemo(() => {
    if (!slimKyodo) return howFound;
    if (
      joinIntent === JOIN_SAME_DAY_LABEL &&
      !howFound.includes(KYODO_HOW_FOUND_CAMPAIGN)
    ) {
      return [...howFound, KYODO_HOW_FOUND_CAMPAIGN];
    }
    return howFound;
  }, [slimKyodo, joinIntent, howFound]);

  const liveDraft = useMemo(() => {
    if (!visitType) return "";
    if (slimKyodo) {
      if (!reviewSeed) return "";
      return buildKyodoReviewDraft({
        storeName: store.name,
        visitType,
        positives,
        seed: reviewSeed,
        howFound: reviewHowFound,
        extraComment,
      });
    }
    return buildTodaReviewDraft({
      storeName: store.name,
      visitType,
      positives,
      extraComment,
      rating: rating ?? 0,
    });
  }, [
    slimKyodo,
    reviewSeed,
    store.name,
    visitType,
    positives,
    extraComment,
    rating,
    howFound,
    reviewHowFound,
  ]);

  const shownDraft = draftTouched ? draft : liveDraft;

  const contactReady = slimKyodo
    ? true
    : isPhoneComplete(phone) && Boolean(emailTrimmed) && !emailInvalid;
  const ageReady = slimKyodo || Boolean(age);
  const durationReady =
    !slimKyodo || visitType !== "taiken" || Boolean(sessionMinutes);

  const formReady =
    visitType !== null &&
    fullName.trim() &&
    (slimKyodo || furigana.trim()) &&
    contactReady &&
    Boolean(gender) &&
    ageReady &&
    Boolean(gymExperience) &&
    howFound.length > 0 &&
    (!needsHowFoundOther || howFoundOther.trim()) &&
    rating !== null &&
    (slimKyodo
      ? Boolean(joinIntent)
      : visitType === "kengaku" || Boolean(joinIntent)) &&
    durationReady &&
    positives.length > 0;

  function selectVisitType(next: TodaVisitType) {
    setVisitType(next);
    if (next !== "taiken") {
      if (!slimKyodo) setJoinIntent("");
      setSessionMinutes("");
    }
  }

  async function handleSubmit() {
    if (!formReady || visitType === null || rating === null || sent || submitting) {
      return;
    }

    const generatedReview = shownDraft.trim();
    setDraft(generatedReview);
    setSaveError("");
    setSubmitting(true);
    try {
      const result = await submitTodaClosingSurvey({
        storeId: store.id,
        storeName: store.name,
        visitType,
        fullName,
        furigana: slimKyodo ? "" : furigana,
        phone: slimKyodo ? "" : phone,
        email: slimKyodo ? "" : emailTrimmed,
        gender,
        age: slimKyodo ? "" : age,
        sessionMinutes:
          slimKyodo && visitType === "taiken" ? sessionMinutes : "",
        university: slimKyodo || !isStudent ? "" : university,
        gymExperience,
        howFound: howFound.join(" / "),
        howFoundOther: needsHowFoundOther ? howFoundOther : "",
        rating,
        joinIntent: slimKyodo || visitType === "taiken" ? joinIntent : "",
        extraComment: slimKyodo ? "" : extraComment,
        positives,
        generatedReview,
        submissionId: submissionIdRef.current,
      });
      if (!result.ok) {
        setSaveError(result.error || CUSTOMER_SAVE_FAILED);
        return;
      }
      try {
        void navigator.clipboard.writeText(generatedReview);
      } catch {
        /* ignore */
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    const goGoogle = rating !== null && rating >= 4 && canPostGoogle;
    return (
      <div data-brand={store.brand} style={brandVars}>
        <div className="px-2 pb-8 pt-8 text-center text-white">
          <div className="survey-success-icon mx-auto" aria-hidden>
            <span className="survey-success-ring" />
            <span className="survey-success-ring survey-success-ring--delay" />
            <span className="survey-success-circle">
              <Check className="survey-success-check h-7 w-7" strokeWidth={2.75} />
            </span>
          </div>
          <h2 className="survey-success-fade-up mt-6 text-[22px] font-bold tracking-tight [text-shadow:0_2px_0_rgba(0,0,0,0.18)]">
            {SURVEY_COMPLETION_THANK_YOU}
          </h2>
          <p className="survey-success-fade-up survey-success-fade-up--delay-1 mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-white/90">
            {SUCCESS_SAVED}
          </p>
        </div>

        <div className="space-y-5 rounded-[1.75rem] bg-white px-5 py-7 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          {goGoogle && shownDraft ? (
            <div className="survey-success-fade-up survey-success-fade-up--delay-2 text-left">
              <p className="mb-2 text-[13px] font-semibold text-zinc-700">
                {SUCCESS_DRAFT_LABEL}
              </p>
              <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800/75 bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-zinc-800">
                {shownDraft}
              </pre>
            </div>
          ) : null}

          <div className="survey-success-fade-up survey-success-fade-up--delay-3 overflow-hidden rounded-2xl bg-[color:var(--joyfit-red)] px-5 py-6 text-center text-white shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <Smartphone className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <p className="mt-4 text-[13px] font-medium tracking-wide text-white/85">
              {APP_INSTALL_LEAD}
            </p>
            <p className="mt-1 text-[16px] font-bold leading-snug tracking-tight">
              {store.appInstallBody}
            </p>
            <a
              href={appInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                const url = resolveAppInstallUrl(store, {
                  userAgent: navigator.userAgent,
                  platform: navigator.platform,
                  maxTouchPoints: navigator.maxTouchPoints,
                });
                if (url === appInstallUrl) return;
                event.preventDefault();
                setAppInstallUrl(url);
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-4 text-[14px] font-bold text-[color:var(--joyfit-red)] shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition hover:bg-white/92"
            >
              {store.appInstallLinkLabel}
            </a>
          </div>

          {goGoogle ? (
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                try {
                  void navigator.clipboard.writeText(shownDraft.trim());
                } catch {
                  /* ignore */
                }
              }}
              className="survey-google-open-btn survey-success-fade-up survey-success-fade-up--delay-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
            >
              {SUCCESS_GOOGLE_BUTTON_LABEL}
            </a>
          ) : null}

          {slimKyodo ? (
            <div className="survey-success-fade-up survey-success-fade-up--delay-4 rounded-xl border border-[color:var(--joyfit-red)]/25 bg-[color:var(--joyfit-red)]/[0.04] px-4 py-3 text-center">
              <p className="text-[11px] font-bold tracking-wide text-[color:var(--joyfit-red)]">
                {KYODO_JOIN_BONUS_KICKER}
              </p>
              <p className="mt-1 text-[13px] font-semibold leading-snug text-zinc-800">
                {KYODO_JOIN_BONUS}
              </p>
            </div>
          ) : null}
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
        {slimKyodo ? null : (
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
        )}
        {slimKyodo ? null : (
          <>
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
          </>
        )}

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

        {slimKyodo ? null : (
          <section className="space-y-2">
            <FieldLabel required>ご年齢</FieldLabel>
            <ChoiceWrap options={AGE_OPTIONS} value={age} onChange={setAge} />
          </section>
        )}

        {slimKyodo ? null : (
        <section className="space-y-2">
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
        )}

        <section className="space-y-2">
          <FieldLabel required>
            {slimKyodo ? KYODO_TRAINING_TITLE : "ジムのご利用経験について"}
          </FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {(slimKyodo ? KYODO_TRAINING_OPTIONS : GYM_EXPERIENCE_OPTIONS).map(
              (opt) => (
                <button
                  key={opt}
                  type="button"
                  className={cn(
                    memberFormChoiceClass(gymExperience === opt),
                    "min-h-12 px-2 text-center text-[13px] leading-snug",
                    !slimKyodo && "text-[12px]",
                  )}
                  onClick={() => setGymExperience(opt)}
                >
                  {opt}
                </button>
              ),
            )}
          </div>
        </section>

        <section className="space-y-2">
          <div className="space-y-1">
            <FieldLabel required>
              {slimKyodo ? KYODO_HOW_FOUND_TITLE : HOW_FOUND_TITLE}
            </FieldLabel>
            {slimKyodo ? (
              <p className={memberFormHintClass}>{KYODO_HOW_FOUND_HINT}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(slimKyodo ? KYODO_HOW_FOUND_OPTIONS : HOW_FOUND_OPTIONS).map(
              (opt) => (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={howFound.includes(opt)}
                  className={cn(
                    memberFormChoiceClass(howFound.includes(opt)),
                    slimKyodo && "min-h-12 px-2 text-center text-[13px] leading-snug",
                    slimKyodo &&
                      opt === KYODO_HOW_FOUND_CAMPAIGN &&
                      !howFound.includes(opt) &&
                      "border-[color:var(--joyfit-red)]/40 bg-[color:var(--joyfit-red)]/[0.06] font-semibold text-[color:var(--joyfit-red)]",
                  )}
                  onClick={() => {
                    if (slimKyodo) {
                      setHowFound((prev) =>
                        prev.includes(opt)
                          ? prev.filter((v) => v !== opt)
                          : [...prev, opt],
                      );
                      return;
                    }
                    setHowFound((prev) => (prev[0] === opt ? [] : [opt]));
                  }}
                >
                  {opt}
                </button>
              ),
            )}
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

        {(slimKyodo && visitType !== null) || visitType === "taiken" ? (
          <section className="space-y-3">
            <FieldLabel required>{JOIN_QUESTION_TITLE}</FieldLabel>
            {slimKyodo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#C21632]/25 bg-[#C21632]/[0.04] px-3.5 py-2.5">
                <p className="flex flex-wrap items-baseline gap-x-1.5 text-[12px] font-semibold text-zinc-700">
                  <span className="text-[#C21632]">{campaignMonthLabel()}限定</span>
                  <span>6か月間</span>
                  <span className="text-[1.15rem] font-bold leading-none text-[#C21632]">
                    2,990円
                  </span>
                </p>
                <a
                  href={KYODO_JOIN_DETAIL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[11px] font-semibold text-[#C21632] underline decoration-[#C21632]/40 underline-offset-4"
                >
                  {KYODO_JOIN_DETAIL_LABEL}
                </a>
              </div>
              <button
                type="button"
                aria-pressed={joinIntent === JOIN_SAME_DAY_LABEL}
                onClick={() => setJoinIntent(JOIN_SAME_DAY_LABEL)}
                className={cn(
                  memberFormChoiceClass(joinIntent === JOIN_SAME_DAY_LABEL),
                  "flex w-full items-center justify-start gap-2 px-3.5 py-3 text-[15px]",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border",
                    joinIntent === JOIN_SAME_DAY_LABEL
                      ? "border-white bg-white text-[color:var(--joyfit-red)]"
                      : "border-zinc-800/70 bg-white text-transparent",
                  )}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {JOIN_SAME_DAY_LABEL}
              </button>
            </div>
            ) : (
            <button
              type="button"
              aria-pressed={joinIntent === JOIN_SAME_DAY_LABEL}
              onClick={() => setJoinIntent(JOIN_SAME_DAY_LABEL)}
              className={cn(
                "w-full overflow-hidden rounded-[1.25rem] border text-left transition",
                joinIntent === JOIN_SAME_DAY_LABEL
                  ? "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-[0_10px_22px_rgba(0,0,0,0.16)]"
                  : "border-zinc-800/80 bg-white text-zinc-900 shadow-[0_4px_12px_rgba(24,24,27,0.08)] hover:-translate-y-0.5",
              )}
            >
              <p
                className={cn(
                  "border-b py-2.5 text-center text-[12px] font-bold tracking-[0.28em]",
                  joinIntent === JOIN_SAME_DAY_LABEL
                    ? "border-white/25 bg-black/10 text-white/90"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500",
                )}
              >
                {JOIN_PERK_KICKER}
              </p>
              <div className="grid grid-cols-2 items-center py-5">
                <div className="flex flex-col items-end justify-center pr-5">
                  <p className="text-[3.15rem] font-bold leading-none tracking-[-0.06em]">
                    {JOIN_PERK_AMOUNT}
                  </p>
                  <p className="mt-1.5 text-[15px] font-bold tracking-[0.22em]">
                    {JOIN_PERK_UNIT}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex flex-col items-start justify-center border-l border-dashed py-1 pl-5",
                    joinIntent === JOIN_SAME_DAY_LABEL
                      ? "border-white/45"
                      : "border-zinc-300",
                  )}
                >
                  <p className="text-[16px] font-bold leading-snug tracking-tight">
                    {JOIN_PERK_FEE}
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-[13px] font-medium leading-relaxed",
                      joinIntent === JOIN_SAME_DAY_LABEL
                        ? "text-white/88"
                        : "text-zinc-500",
                    )}
                  >
                    {JOIN_PERK_COMBO}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "border-t py-3.5 text-center text-[16px] font-bold tracking-[0.22em]",
                  joinIntent === JOIN_SAME_DAY_LABEL
                    ? "border-white/25 bg-black/10"
                    : "border-zinc-200 bg-zinc-50",
                )}
              >
                {JOIN_SAME_DAY_LABEL}
              </p>
            </button>
            )}
            <div className="grid grid-cols-3 gap-2">
              {JOIN_OPTIONS.slice(1).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={cn(
                    memberFormChoiceClass(joinIntent === opt),
                    "px-1.5 text-[13px]",
                  )}
                  onClick={() => setJoinIntent(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {slimKyodo && visitType === "taiken" ? (
              <section className="space-y-2 pt-1">
                <FieldLabel required hint={SESSION_MINUTES_HINT}>
                  {SESSION_MINUTES_TITLE}
                </FieldLabel>
                <div className="grid grid-cols-5 gap-2">
                  {SESSION_MINUTES_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={cn(
                        memberFormChoiceClass(sessionMinutes === opt),
                        "min-h-11 px-1 text-[13px] font-semibold",
                      )}
                      onClick={() => setSessionMinutes(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        ) : null}

        {slimKyodo ? null : (
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
        )}

        <section className="space-y-3 border-t border-zinc-100 pt-6">
          {slimKyodo ? (
            <FieldLabel required hint={`最大${MAX_REVIEW_POSITIVES}つ`}>
              {KYODO_POSITIVES_TITLE}
            </FieldLabel>
          ) : (
            <div className="space-y-1">
              <FieldLabel required>{REVIEW_POSITIVES_TITLE}</FieldLabel>
              <p className={memberFormHintClass}>
                {REVIEW_POSITIVES_HINT}（最大{MAX_REVIEW_POSITIVES}つ）
              </p>
            </div>
          )}
          <div
            className={
              slimKyodo ? "grid grid-cols-2 gap-2.5" : "flex flex-wrap gap-2"
            }
          >
            {(slimKyodo
              ? KYODO_REVIEW_POSITIVE_OPTIONS
              : REVIEW_POSITIVE_OPTIONS
            ).map((opt) => {
              const active = positives.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={active}
                  className={
                    slimKyodo
                      ? cn(
                          "relative min-h-[4.35rem] rounded-2xl border px-3.5 py-3 text-left transition",
                          active
                            ? "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-[0_10px_20px_rgba(165,53,75,0.2)]"
                            : "border-zinc-200 bg-zinc-50 text-zinc-800 shadow-[0_2px_8px_rgba(24,24,27,0.04)] hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white",
                        )
                      : memberFormChoiceClass(active)
                  }
                  onClick={() =>
                    setPositives((prev) =>
                      toggleLimited(prev, opt, MAX_REVIEW_POSITIVES),
                    )
                  }
                >
                  {slimKyodo ? (
                    <>
                      <span className="block pr-5 text-[13px] font-semibold leading-snug tracking-tight">
                        {opt}
                      </span>
                      {active ? (
                        <Check
                          className="absolute right-2.5 top-2.5 h-4 w-4"
                          strokeWidth={2.6}
                        />
                      ) : null}
                    </>
                  ) : (
                    opt
                  )}
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

        {saveError ? (
          <p className={memberFormErrorClass}>{saveError}</p>
        ) : !formReady ? (
          <p className={memberFormHintClass}>未入力の項目があります</p>
        ) : null}
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!formReady || submitting}
          className="h-12 w-full rounded-2xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          {submitting ? "保存中…" : REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL}
        </Button>
      </div>
    </div>
  );
}
