"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Star } from "lucide-react";

import { submitTodaClosingSurvey } from "@/app/actions/submit-toda-closing-survey";
import { Fit365Header } from "@/components/joyfit/fit365-header";
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
  AGE_OPTIONS,
  APP_SECTION_BODY,
  APP_SECTION_LINK_LABEL,
  APP_SECTION_TITLE,
  buildTodaReviewDraft,
  GENDER_OPTIONS,
  GYM_EXPERIENCE_OPTIONS,
  HOW_FOUND_OPTIONS,
  JOIN_OPTIONS,
  JOIN_QUESTION_CAMPAIGN_LINES,
  JOIN_QUESTION_NOTE,
  JOIN_QUESTION_TITLE,
  KENGAKU_INTRO_LINES,
  KENGAKU_NOTES,
  KENGAKU_TITLE,
  MAX_REVIEW_POSITIVES,
  npsToGoogleStars,
  NPS_MAX,
  NPS_MIN,
  NPS_QUESTION,
  NPS_SCALE_HINT,
  REVIEW_POSITIVE_OPTIONS,
  REVIEW_POSITIVES_HINT,
  REVIEW_POSITIVES_TITLE,
  TAIKEN_HOURS,
  TAIKEN_HOURS_TITLE,
  TAIKEN_INTRO_LINES,
  TAIKEN_NOTES,
  TAIKEN_TITLE,
  TODA_STORE,
  toggleLimited,
  VISIT_TYPE_LABEL,
  type TodaVisitType,
} from "@/lib/newstore/toda-closing";
import { cn } from "@/lib/utils";

type Props = {
  googleReviewUrl: string;
};

const NPS_VALUES = Array.from(
  { length: NPS_MAX - NPS_MIN + 1 },
  (_, i) => NPS_MIN + i,
);
const GOOGLE_STARS = [1, 2, 3, 4, 5] as const;

function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `toda-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayDateValue(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nowTimeValue(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
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
      <p className="text-[15px] font-semibold tracking-tight text-zinc-900">
        {children}
      </p>
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
  );
}

function ChoiceList({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid gap-2">
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

export function TodaClosingSurvey({ googleReviewUrl }: Props) {
  const theme = BRAND_THEMES.fit365;
  const brandVars = useMemo(() => brandCssVars(theme), [theme]);
  const submissionIdRef = useRef(newSubmissionId());

  const [visitType, setVisitType] = useState<TodaVisitType | null>(null);
  const [fullName, setFullName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [university, setUniversity] = useState("");
  const [visitedDate, setVisitedDate] = useState(todayDateValue);
  const [visitedTime, setVisitedTime] = useState(nowTimeValue);
  const [gymExperience, setGymExperience] = useState("");
  const [howFound, setHowFound] = useState("");
  const [howFoundOther, setHowFoundOther] = useState("");
  const [nps, setNps] = useState<number | null>(null);
  const [npsReason, setNpsReason] = useState("");
  const [joinIntent, setJoinIntent] = useState("");
  const [facilityComment, setFacilityComment] = useState("");
  const [positives, setPositives] = useState<string[]>([]);
  const [googleRating, setGoogleRating] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [draftTouched, setDraftTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const emailTrimmed = email.trim();
  const emailInvalid =
    Boolean(emailTrimmed) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const needsHowFoundOther = howFound === "その他";
  const visitedAt =
    visitedDate && visitedTime
      ? `${visitedDate} ${visitedTime}`
      : visitedDate || visitedTime;

  const liveDraft = useMemo(() => {
    if (!visitType) return "";
    return buildTodaReviewDraft({
      visitType,
      positives,
      npsReason,
      facilityComment,
      googleRating: googleRating ?? (nps ? npsToGoogleStars(nps) : 5),
    });
  }, [visitType, positives, npsReason, facilityComment, googleRating, nps]);

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
    Boolean(visitedDate) &&
    Boolean(visitedTime) &&
    Boolean(gymExperience) &&
    Boolean(howFound) &&
    (!needsHowFoundOther || howFoundOther.trim()) &&
    nps !== null &&
    npsReason.trim() &&
    (visitType === "kengaku" || Boolean(joinIntent)) &&
    positives.length > 0 &&
    googleRating !== null;

  function handleNps(value: number) {
    setNps(value);
    setGoogleRating(npsToGoogleStars(value));
  }

  function resetVisitType() {
    setVisitType(null);
    setJoinIntent("");
    setSent(false);
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (!formReady || visitType === null || nps === null || googleRating === null) {
      return;
    }
    if (submitting || sent) return;
    setSubmitting(true);
    setSubmitError(null);

    const generatedReview = shownDraft.trim();
    const result = await submitTodaClosingSurvey({
      visitType,
      fullName,
      furigana,
      phone,
      email: emailTrimmed,
      gender,
      age,
      university,
      visitedAt,
      gymExperience,
      howFound,
      howFoundOther: needsHowFoundOther ? howFoundOther : "",
      nps,
      npsReason,
      joinIntent: visitType === "taiken" ? joinIntent : "",
      facilityComment,
      positives,
      googleRating,
      generatedReview,
      submissionId: submissionIdRef.current,
    });

    if (!result.ok) {
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    setDraft(generatedReview);
    if (googleRating >= 4 && googleReviewUrl.trim()) {
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
      <div data-brand="fit365" className={memberFormCardClass} style={brandVars}>
        <Fit365Header
          title={
            <h1 className="text-[1.35rem] font-bold tracking-tight md:text-[1.55rem]">
              見学・体験アンケート
            </h1>
          }
        >
          <p className="relative z-[1] mt-3 text-[13px] text-white/90">
            {TODA_STORE.name}
          </p>
        </Fit365Header>
        <div className={`${memberFormBodyClass} space-y-4`}>
          <p className="text-center text-[15px] font-semibold text-zinc-900">
            本日はどちらですか？
          </p>
          <button
            type="button"
            onClick={() => setVisitType("kengaku")}
            className="flex min-h-20 w-full flex-col items-center justify-center rounded-2xl border border-zinc-800/70 bg-white px-4 py-5 text-center shadow-sm transition hover:border-zinc-900 hover:shadow-md"
          >
            <span className="text-lg font-bold text-zinc-900">見学</span>
            <span className="mt-1 text-[13px] text-zinc-500">施設のご案内・見学</span>
          </button>
          <button
            type="button"
            onClick={() => setVisitType("taiken")}
            className="flex min-h-20 w-full flex-col items-center justify-center rounded-2xl border-2 border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] px-4 py-5 text-center text-white shadow-md transition hover:bg-[color:var(--joyfit-red-dark)]"
          >
            <span className="text-lg font-bold">無料体験</span>
            <span className="mt-1 text-[13px] text-white/90">体験当日のアンケート</span>
          </button>
        </div>
      </div>
    );
  }

  if (sent) {
    const goGoogle = googleRating !== null && googleRating >= 4 && googleReviewUrl.trim();
    return (
      <div data-brand="fit365" className={memberFormCardClass} style={brandVars}>
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
        <div className={`${memberFormBodyClass} px-6 py-8 text-center`}>
          {goGoogle && shownDraft ? (
            <div className="mx-auto max-w-sm text-left">
              <p className="mb-2 text-[13px] font-semibold text-zinc-700">
                口コミ文面（コピー済み）
              </p>
              <pre className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-zinc-800">
                {shownDraft}
              </pre>
              <p className="mt-3 text-[12px] leading-relaxed text-zinc-500">
                Googleマップでも星{googleRating}の評価を選択してください。
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

  const title = visitType === "kengaku" ? KENGAKU_TITLE : TAIKEN_TITLE;
  const introLines =
    visitType === "kengaku" ? KENGAKU_INTRO_LINES : TAIKEN_INTRO_LINES;
  const dateLabel =
    visitType === "kengaku"
      ? "見学に参加された日時"
      : "体験に参加された日時";

  return (
    <div data-brand="fit365" className={memberFormCardClass} style={brandVars}>
      <Fit365Header
        title={
          <h1 className="text-[1.35rem] font-bold tracking-tight md:text-[1.55rem]">
            {title}
          </h1>
        }
      >
        <p className="relative z-[1] mt-3 text-[13px] text-white/90">
          {TODA_STORE.name} ／ {VISIT_TYPE_LABEL[visitType]}
        </p>
      </Fit365Header>

      <div className={`${memberFormBodyClass} space-y-7`}>
        <button
          type="button"
          onClick={resetVisitType}
          className="text-[12px] font-semibold text-zinc-500 underline underline-offset-2"
        >
          ← 見学 / 無料体験を選び直す
        </button>

        <div className="space-y-2 text-[13px] leading-relaxed text-zinc-600">
          {introLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {visitType === "taiken" ? (
            <>
              <p className="pt-2 font-semibold text-zinc-800">{TAIKEN_HOURS_TITLE}</p>
              <p>{TAIKEN_HOURS}</p>
              <p className="pt-2 font-semibold text-zinc-800">【注意事項】</p>
              {TAIKEN_NOTES.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </>
          ) : (
            KENGAKU_NOTES.map((line) => <p key={line}>{line}</p>)
          )}
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
          <ChoiceList options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        </section>

        <section className="space-y-2">
          <FieldLabel required>ご年齢</FieldLabel>
          <ChoiceList options={AGE_OPTIONS} value={age} onChange={setAge} />
        </section>

        <section className="space-y-2">
          <FieldLabel>大学生の方はよろしければ大学名を教えてください。</FieldLabel>
          <Input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className={memberFormInputClass}
            placeholder="任意"
          />
        </section>

        <section className="space-y-2">
          <FieldLabel required>{dateLabel}</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={visitedDate}
              onChange={(e) => setVisitedDate(e.target.value)}
              className={memberFormInputClass}
            />
            <Input
              type="time"
              value={visitedTime}
              onChange={(e) => setVisitedTime(e.target.value)}
              className={memberFormInputClass}
            />
          </div>
        </section>

        <section className="space-y-2">
          <FieldLabel required>ジムのご利用経験について</FieldLabel>
          <ChoiceList
            options={GYM_EXPERIENCE_OPTIONS}
            value={gymExperience}
            onChange={setGymExperience}
          />
        </section>

        <section className="space-y-2">
          <FieldLabel required>当クラブをどこでお知りになりましたか？</FieldLabel>
          <ChoiceList
            options={HOW_FOUND_OPTIONS}
            value={howFound}
            onChange={setHowFound}
          />
          {needsHowFoundOther ? (
            <Input
              value={howFoundOther}
              onChange={(e) => setHowFoundOther(e.target.value)}
              className={memberFormInputClass}
              placeholder="その他の回答"
            />
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <FieldLabel required>{NPS_QUESTION}</FieldLabel>
            <p className="text-[12px] leading-relaxed text-zinc-500">{NPS_SCALE_HINT}</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {NPS_VALUES.map((value) => {
              const active = nps === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleNps(value)}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-xl border text-[15px] font-bold transition",
                    active
                      ? "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-md"
                      : "border-zinc-800/75 bg-white text-zinc-800",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <FieldLabel required>上記評価にした理由を教えてください。</FieldLabel>
          <Textarea
            value={npsReason}
            onChange={(e) => setNpsReason(e.target.value)}
            rows={3}
            className={memberFormTextareaClass}
            placeholder="理由をご記入ください"
          />
        </section>

        {visitType === "taiken" ? (
          <section className="space-y-3">
            <div className="space-y-1">
              <FieldLabel required>{JOIN_QUESTION_TITLE}</FieldLabel>
              {JOIN_QUESTION_CAMPAIGN_LINES.map((line) => (
                <p key={line} className="text-[13px] font-semibold text-zinc-800">
                  {line}
                </p>
              ))}
              <p className="text-[12px] text-zinc-500">{JOIN_QUESTION_NOTE}</p>
            </div>
            <ChoiceList
              options={JOIN_OPTIONS}
              value={joinIntent}
              onChange={setJoinIntent}
            />
          </section>
        ) : null}

        <section className="space-y-2">
          <FieldLabel>施設やスタッフの感想などあればご記載ください。</FieldLabel>
          <Textarea
            value={facilityComment}
            onChange={(e) => setFacilityComment(e.target.value)}
            rows={3}
            className={memberFormTextareaClass}
            placeholder="任意"
          />
        </section>

        <section className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[15px] font-semibold text-zinc-900">{APP_SECTION_TITLE}</p>
          <p className="text-[13px] leading-relaxed text-zinc-600">{APP_SECTION_BODY}</p>
          <a
            href={TODA_STORE.appInstallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-[14px] font-semibold text-[color:var(--joyfit-red)] underline underline-offset-2"
          >
            {APP_SECTION_LINK_LABEL}
          </a>
        </section>

        <section className="space-y-3 border-t-2 border-[color:var(--joyfit-red)]/30 pt-7">
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-[0.16em] text-[color:var(--joyfit-red)]">
              GOOGLE口コミ
            </p>
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
          <FieldLabel required>Googleマップに投稿する星評価</FieldLabel>
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-4">
            {GOOGLE_STARS.map((value) => {
              const filled = googleRating !== null && value <= googleRating;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value}つ星`}
                  onClick={() => setGoogleRating(value)}
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
          {googleRating ? (
            <p className="text-center text-[13px] font-medium text-zinc-600">
              星{googleRating}
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <FieldLabel>口コミ文面（必要なら直してください）</FieldLabel>
          <Textarea
            value={shownDraft}
            onChange={(e) => {
              setDraftTouched(true);
              setDraft(e.target.value);
            }}
            rows={6}
            className={memberFormTextareaClass}
            placeholder="よかった点を選ぶと、ここに文面ができます"
          />
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
            disabled={!formReady || submitting}
            className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {submitting
              ? "送信中…"
              : googleRating !== null && googleRating >= 4
                ? "保存してGoogle口コミへ"
                : "回答を保存する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
