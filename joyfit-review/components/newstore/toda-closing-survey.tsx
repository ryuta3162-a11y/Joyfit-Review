"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, Eye, Sparkles, Star } from "lucide-react";

import { submitTodaClosingSurvey } from "@/app/actions/submit-toda-closing-survey";
import { warmupClosingSurveyGas } from "@/app/actions/warmup-closing-survey-gas";
import { Fit365Mascot } from "@/components/joyfit/fit365-mascot";
import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
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
  AGE_OPTIONS,
  APP_SECTION_TITLE,
  buildTodaReviewDraft,
  EXTRA_COMMENT_TITLE,
  GENDER_OPTIONS,
  GYM_EXPERIENCE_OPTIONS,
  HOW_FOUND_OPTIONS,
  JOIN_OPTIONS,
  JOIN_QUESTION_TITLE,
  MAX_REVIEW_POSITIVES,
  PAGE_TITLE,
  RATING_HINT,
  RATING_QUESTION,
  REVIEW_POSITIVE_OPTIONS,
  REVIEW_POSITIVES_HINT,
  REVIEW_POSITIVES_TITLE,
  STUDENT_TOGGLE_LABEL,
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

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
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
      <p className={memberFormSectionTitleClass}>{children}</p>
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

function VisitTypeCard({
  label,
  hint,
  icon,
  onClick,
}: {
  label: string;
  hint: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[1.6rem] border border-zinc-100/80 bg-white px-5 py-6 text-left shadow-[0_12px_30px_rgba(24,24,27,0.08)] transition hover:-translate-y-0.5 hover:border-[color:var(--joyfit-red)]/30 hover:shadow-[0_18px_36px_rgba(24,24,27,0.12)]"
    >
      <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[color:var(--joyfit-red)]/[0.07] transition group-hover:bg-[color:var(--joyfit-red)]/15" />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--joyfit-red)]/10 text-[color:var(--joyfit-red)] transition group-hover:bg-[color:var(--joyfit-red)] group-hover:text-white">
        {icon}
      </span>
      <span className="relative mt-4 block text-[1.25rem] font-bold tracking-tight text-zinc-900">
        {label}
      </span>
      <span className="relative mt-1 block text-[12px] leading-relaxed text-zinc-500">
        {hint}
      </span>
    </button>
  );
}

function PageHeader({
  store,
  subtitle,
  onBack,
  compact = false,
}: {
  store: ClosingStore;
  subtitle?: string;
  onBack?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden text-center text-white",
        compact ? "px-6 pb-8 pt-5" : "px-6 pb-[4.75rem] pt-10",
      )}
      style={{
        background:
          "linear-gradient(165deg, var(--joyfit-red) 0%, var(--joyfit-red-dark) 100%)",
      }}
    >
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-[-3rem] h-48 w-48 rounded-full bg-black/15 blur-3xl" />
      {!compact ? (
        <>
          <div className="pointer-events-none absolute left-1/2 top-4 h-44 w-44 -translate-x-1/2 rounded-full border border-white/20" />
          <div className="pointer-events-none absolute left-1/2 -top-2 h-56 w-56 -translate-x-1/2 rounded-full border border-white/10" />
        </>
      ) : null}

      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="戻る"
          className="absolute left-3 top-5 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.4} />
        </button>
      ) : null}

      <div
        className={cn(
          "relative z-[1] mx-auto",
          store.brand === "fit365" ? "w-full max-w-[14rem]" : "w-full max-w-[15rem]",
        )}
      >
        {store.brand === "fit365" ? (
          <Fit365Mascot priority className="h-auto w-full object-contain" />
        ) : (
          <JoyfitHeaderLogo
            brand={store.brand}
            className="py-2 [&_img]:h-11 [&_img]:md:h-12"
          />
        )}
      </div>
      <h1 className="relative z-[1] mt-6 text-[1.65rem] font-bold tracking-tight">
        {PAGE_TITLE}
      </h1>
      <p className="relative z-[1] mx-auto mt-3 inline-flex rounded-full bg-white/18 px-3.5 py-1 text-[12px] font-medium text-white ring-1 ring-white/25 backdrop-blur-sm">
        {subtitle ?? store.name}
      </p>

      {!compact ? (
        <svg
          className="pointer-events-none absolute inset-x-0 -bottom-px h-11 w-full text-white"
          viewBox="0 0 1440 88"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0 54c180 28 360-36 540-28 180 8 270 52 450 44 180-8 330-56 450-36v54H0Z"
          />
        </svg>
      ) : null}
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

  function resetVisitType() {
    setVisitType(null);
    setJoinIntent("");
    setSent(false);
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

  if (!visitType) {
    return (
      <div data-brand={store.brand} className={memberFormCardClass} style={brandVars}>
        <PageHeader store={store} />
        <div className="relative z-[1] -mt-9 px-5 pb-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <VisitTypeCard
              label="見学"
              hint="施設のご案内を受けた方"
              icon={<Eye className="h-5 w-5" strokeWidth={2.2} />}
              onClick={() => setVisitType("kengaku")}
            />
            <VisitTypeCard
              label="無料体験"
              hint="体験トレーニングをされた方"
              icon={<Sparkles className="h-5 w-5" strokeWidth={2.2} />}
              onClick={() => setVisitType("taiken")}
            />
          </div>
        </div>
      </div>
    );
  }

  if (sent) {
    const goGoogle = rating !== null && rating >= 4 && canPostGoogle;
    return (
      <div data-brand={store.brand} className={memberFormCardClass} style={brandVars}>
        <div
          className="relative overflow-hidden px-6 pb-10 pt-12 text-center text-white"
          style={{ background: "var(--joyfit-red)" }}
        >
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-4rem] h-44 w-44 rounded-full bg-black/10 blur-3xl" />
          <div className="relative z-[1] mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Check className="h-7 w-7" strokeWidth={2.75} />
          </div>
          <h2 className="relative z-[1] mt-7 text-[22px] font-bold tracking-tight">
            ご協力ありがとうございます
          </h2>
          <p className="relative z-[1] mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-white/90">
            {goGoogle
              ? "口コミ文をコピーしました。Googleマップへ投稿をお願いします。"
              : "回答を受け付けました。"}
          </p>
        </div>
        <div className="space-y-5 px-6 py-8">
          {shownDraft ? (
            <div className="mx-auto max-w-sm text-left">
              <p className="mb-2 text-[13px] font-semibold text-zinc-700">
                口コミ文面（コピー済み）
              </p>
              <pre className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-zinc-800">
                {shownDraft}
              </pre>
              {goGoogle ? (
                <>
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
                </>
              ) : null}
            </div>
          ) : null}

          <div className="mx-auto max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-4 text-left">
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
    <div data-brand={store.brand} className={memberFormCardClass} style={brandVars}>
      <PageHeader
        store={store}
        subtitle={`${store.name} ／ ${VISIT_TYPE_LABEL[visitType]}`}
        onBack={resetVisitType}
        compact
      />

      <div className={memberFormBodyClass}>
        <section className={memberFormSectionClass}>
          <FieldLabel required>お名前 (フルネーム)</FieldLabel>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={memberFormInputClass}
            autoComplete="name"
            placeholder="山田 花子"
          />
        </section>

        <section className={memberFormSectionClass}>
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

        <section className={memberFormSectionClass}>
          <FieldLabel required>ご連絡先 (電話番号)</FieldLabel>
          <Input
            value={phone}
            onChange={(e) => setPhone(digitsOnly(e.target.value))}
            className={memberFormInputClass}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="tel-national"
            placeholder="09012345678"
          />
        </section>

        <section className={memberFormSectionClass}>
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
            <p className="text-[12px] font-medium text-[color:var(--joyfit-red)]">
              メールアドレスの形式をご確認ください
            </p>
          ) : null}
        </section>

        <section className={memberFormSectionClass}>
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

        <section className={memberFormSectionClass}>
          <FieldLabel required>ご年齢</FieldLabel>
          <ChoiceWrap options={AGE_OPTIONS} value={age} onChange={setAge} />
          <button
            type="button"
            className={memberFormTagClass(isStudent)}
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

        <section className={memberFormSectionClass}>
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

        <section className={memberFormSectionClass}>
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
          <section className={memberFormSectionClass}>
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

        <section className={memberFormSectionClass}>
          <FieldLabel>{EXTRA_COMMENT_TITLE}</FieldLabel>
          <Textarea
            value={extraComment}
            onChange={(e) => setExtraComment(e.target.value)}
            rows={3}
            className={memberFormTextareaClass}
            placeholder="任意"
          />
        </section>

        <section className={memberFormSectionDividerClass}>
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

        <section className={`${memberFormSectionClass} text-center`}>
          <FieldLabel required>{RATING_QUESTION}</FieldLabel>
          <p className="text-[13px] text-zinc-500">{RATING_HINT}</p>
          <RatingStars rating={rating ?? 0} onSelect={setRating} />
        </section>

        <section className={memberFormSectionClass}>
          <FieldLabel>口コミ文面（必要なら直してください）</FieldLabel>
          <Textarea
            value={shownDraft}
            onChange={(e) => {
              setDraftTouched(true);
              setDraft(e.target.value);
            }}
            rows={5}
            className={memberFormTextareaClass}
            autoComplete="off"
            placeholder="よかった点を選ぶと、ここに文面ができます"
          />
        </section>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!formReady}
          className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] disabled:bg-zinc-300 disabled:text-zinc-500"
        >
          {rating !== null && rating >= 4 && canPostGoogle
            ? "保存してGoogle口コミへ"
            : "回答を保存する"}
        </Button>
      </div>
    </div>
  );
}
