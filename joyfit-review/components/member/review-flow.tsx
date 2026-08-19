"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Mail, Star } from "lucide-react";

import { submitMemberSurvey } from "@/app/actions/submit-member-survey";
import { warmupSurveyGas } from "@/app/actions/warmup-survey-gas";
import { AppGuideScreenshot } from "@/components/member/app-guide-screenshot";
import {
  EMPTY_GOOGLE_POST_CONSENT,
  GooglePostConsentPanel,
  isGooglePostFullyConsented,
  type GooglePostConsentState,
} from "@/components/member/google-post-consent-panel";
import { MemberFormField } from "@/components/member/member-form-field";
import {
  memberFormCardClass,
  memberFormChoiceClass,
  memberFormBodyClass,
  memberFormGuideCardClass,
  memberFormInputClass,
  memberFormLabelClass,
  memberFormSectionClass,
  memberFormSectionDividerClass,
  memberFormSectionTitleClass,
  memberFormTagClass,
  memberFormTextareaClass,
} from "@/components/member/member-form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandCssVars, getBrandTheme } from "@/lib/brand";
import { CUSTOMER_SAVE_FAILED } from "@/lib/gas-webapp";
import { type StoreRewardDisplay } from "@/lib/store-reward";
import {
  REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL,
  REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL,
  LOW_RATING_SAVE_BUTTON_LABEL,
  getHighRatingGoogleMapHint,
  type GooglePostConsentKey,
  SURVEY_COMPLETION_POINT_PENDING_NOTE_LINES,
  SURVEY_COMPLETION_REVIEW_PREFACE_TITLE,
  SURVEY_COMPLETION_THANK_YOU,
  SURVEY_REWARD_GRANT_NOTE,
} from "@/lib/member-reward-copy";
import {
  buildReviewDraft,
  getReviewSurveyOptions,
  MAX_PICKS_PER_SECTION,
  reviewSectionLabels,
  shuffleOptions,
  toggleLimitedPick,
} from "@/lib/review-survey-options";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  storeId: string;
  storeName: string;
  reviewUrl: string;
  /** 店舗マスタの通知先。空のときは DEFAULT_LOW_RATING_EMAIL を使用 */
  feedbackEmail: string;
  reward: StoreRewardDisplay;
  /** EAST / WEST。未指定時は EAST */
  region?: "east" | "west";
};

const stars = [1, 2, 3, 4, 5];
const genderOptions = ["男性", "女性", "その他"] as const;
const ageOptions = ["10代", "20代", "30代", "40代", "50代", "60代以上"] as const;

function localDateIsoForRecord(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function highRatingThankYouMessage(rating: number): string {
  return `星${rating}の高評価ありがとうございます。`;
}

function buildLowRatingMailBody(storeName: string): string {
  return [
    `店舗名: ${storeName}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "▼ この枠内にお問い合わせ内容をご記入ください ▼",
    "（気になった点 / ご要望 / 改善してほしい点 など）",
    "",
    "",
    "",
    "",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "今後のサービス向上の為、素直なご意見をいただければ幸いです。",
  ].join("\n");
}

/** スマホのメールアプリ（Gmail含む）で下書きを開く mailto リンク */
function buildLowRatingMailtoUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${to}?${params.toString()}`;
}

/** PCブラウザ向け。保存後も元の画面を残したまま Gmail 下書きを別タブで開く */
function buildLowRatingGmailWebUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    tf: "1",
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function isTouchPhone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

type RatingStarsProps = {
  rating: number;
  interactive?: boolean;
  disabled?: boolean;
  onSelect?: (value: number) => void;
  emptyStarClass?: string;
};

function RatingStars({
  rating,
  interactive = false,
  disabled = false,
  onSelect,
  emptyStarClass = "text-zinc-300",
}: RatingStarsProps) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {stars.map((value) => {
        const filled = value <= rating;
        const star = (
          <Star
            className={`h-9 w-9 sm:h-10 sm:w-10 ${filled ? "fill-[#fbbc04] text-[#fbbc04]" : emptyStarClass}`}
          />
        );
        if (interactive && onSelect) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              disabled={disabled}
              className="rounded-lg p-1.5 transition hover:bg-zinc-100 disabled:cursor-not-allowed"
              aria-label={`${value}つ星`}
            >
              {star}
            </button>
          );
        }
        return (
          <span key={value} className="p-1.5" aria-hidden>
            {star}
          </span>
        );
      })}
    </div>
  );
}

export function ReviewFlow({
  storeId,
  storeName,
  reviewUrl,
  feedbackEmail,
  reward,
  region = "east",
}: Props) {
  const brandTheme = useMemo(() => getBrandTheme(storeName), [storeName]);
  const brandVars = useMemo(() => brandCssVars(brandTheme), [brandTheme]);
  const pathPrefix = region === "west" ? "/west" : "";
  const surveyVariant = brandTheme.brand === "yoga" ? "yoga" : "gym";
  const surveyOptions = useMemo(
    () => getReviewSurveyOptions(surveyVariant),
    [surveyVariant],
  );
  const shuffledMenuOptions = useMemo(
    () => shuffleOptions(surveyOptions.service),
    [surveyOptions.service],
  );
  const shuffledEnvOptions = useMemo(
    () => shuffleOptions(surveyOptions.environment),
    [surveyOptions.environment],
  );
  const shuffledSceneOptions = useMemo(
    () => shuffleOptions(surveyOptions.audience),
    [surveyOptions.audience],
  );
  const [rating, setRating] = useState<number | null>(null);
  const [menuPoints, setMenuPoints] = useState<string[]>([]);
  const [envPoints, setEnvPoints] = useState<string[]>([]);
  const [scenes, setScenes] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [gender, setGender] = useState<(typeof genderOptions)[number] | "">("");
  const [ageRange, setAgeRange] = useState("");
  const [email, setEmail] = useState("");
  /** 回答日（ローカル日付・送信データにのみ使用） */
  const recordedVisitDate = useMemo(() => localDateIsoForRecord(), []);
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const [sentKind, setSentKind] = useState<"high" | "low">("high");
  const [lowRatingMailtoUrl, setLowRatingMailtoUrl] = useState<string | null>(null);
  const [lowRatingGmailWebUrl, setLowRatingGmailWebUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googlePostConsents, setGooglePostConsents] =
    useState<GooglePostConsentState>(EMPTY_GOOGLE_POST_CONSENT);
  /** 送信ボタン1回分のID。エラー時の再送は同じIDで冪等に処理する */
  const submissionIdRef = useRef<string | null>(null);
  const highSubmitLockRef = useRef(false);

  const memberCodeOk = useMemo(() => /^\d{10}$/.test(memberCode.trim()), [memberCode]);
  const formFieldsLocked = !memberCodeOk;
  const googlePostReady = isGooglePostFullyConsented(googlePostConsents);

  function toggleGooglePostConsent(key: GooglePostConsentKey) {
    setGooglePostConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getSubmissionId(): string {
    if (!submissionIdRef.current) {
      submissionIdRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return submissionIdRef.current;
  }

  useEffect(() => {
    void warmupSurveyGas(region);
  }, [region]);

  useEffect(() => {
    if (!sent || sentKind !== "low") return;
    window.scrollTo(0, 0);
  }, [sent, sentKind]);

  useEffect(() => {
    setGooglePostConsents(EMPTY_GOOGLE_POST_CONSENT);
  }, [draft, rating]);

  const isHigh = useMemo(() => (rating ?? 0) >= 4, [rating]);
  const canBuildGoogleDraft = (rating ?? 0) >= 4;
  const isLowSelected = rating !== null && !isHigh;

  function selectRating(value: number) {
    if (formFieldsLocked) return;
    setRating(value);
    if (value < 4) {
      setDraft("");
    }
    void warmupSurveyGas(region);
  }

  function toggleMenuPoint(point: string) {
    setMenuPoints((current) => toggleLimitedPick(current, point));
  }

  function toggleEnvPoint(point: string) {
    setEnvPoints((current) => toggleLimitedPick(current, point));
  }

  function toggleScene(scene: string) {
    setScenes((current) => toggleLimitedPick(current, scene));
  }

  const showReviewStep2 = menuPoints.length > 0;
  const showReviewStep3 = envPoints.length > 0;
  const reviewPicksReady =
    menuPoints.length > 0 && envPoints.length > 0 && scenes.length > 0;

  const allPositives = useMemo(() => [...menuPoints, ...envPoints], [menuPoints, envPoints]);
  const profileComplete =
    fullName.trim() &&
    gender &&
    ageRange &&
    email.trim() &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    memberCodeOk;

  function buildDraft() {
    if (!rating || !profileComplete) return;

    const body = buildReviewDraft({
      service: menuPoints,
      environment: envPoints,
      audience: scenes,
      freeComment: feedback,
      variant: surveyVariant,
    });

    setDraft(body);
  }

  async function submitSurvey(payloadReview: string) {
    if (!rating || !profileComplete) return { ok: false as const, error: "必須項目を入力してください。" };
    return submitMemberSurvey({
      storeId,
      storeName,
      rating,
      fullName,
      memberCode,
      gender,
      ageRange,
      email,
      visitDate: recordedVisitDate,
      positives: allPositives,
      useScenes: scenes,
      freeComment: feedback,
      generatedReview: payloadReview,
      storeFeedbackEmail: feedbackEmail,
      skipAutoMail: payloadReview === "" && rating <= 3,
      submissionId: getSubmissionId(),
      region,
    });
  }

  async function saveHighRatingSurvey() {
    if (!draft || sent || submitting || !googlePostReady) return;
    if (highSubmitLockRef.current) return;
    highSubmitLockRef.current = true;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await submitSurvey(draft);
      if (!result.ok) {
        highSubmitLockRef.current = false;
        setSubmitError(result.error);
        return;
      }
      setSentKind("high");
      setSent(true);
    } catch {
      highSubmitLockRef.current = false;
      setSubmitError(CUSTOMER_SAVE_FAILED);
    } finally {
      setSubmitting(false);
    }
  }

  function getLowRatingContactDraft() {
    if (!rating || rating >= 4) return;
    const recipients = feedbackEmail
      .split(/[,\s;]+/)
      .map((v) => v.trim())
      .filter((v) => v.includes("@"));
    if (!recipients.length) {
      setSubmitError("お問い合わせの準備ができませんでした。店舗スタッフまでお声がけください。");
      return null;
    }
    const to = recipients.join(",");
    const subject = `【${storeName}】お客様のお声`;
    const body = buildLowRatingMailBody(storeName);
    return {
      to,
      subject,
      body,
      mailtoUrl: buildLowRatingMailtoUrl(to, subject, body),
      gmailWebUrl: buildLowRatingGmailWebUrl(to, subject, body),
    };
  }

  async function handleLowRatingSubmit() {
    if (!rating || rating >= 4 || submitting || sent) return;
    const mailDraft = getLowRatingContactDraft();
    if (!mailDraft) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitSurvey("");
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setLowRatingMailtoUrl(mailDraft.mailtoUrl);
      setLowRatingGmailWebUrl(mailDraft.gmailWebUrl);
      setSentKind("low");
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  /* 低評価の完了画面は別ページに飛ばさず、同じフロー内で表示（下の isLowSelected セクション内） */

  const isFit365 = brandTheme.brand === "fit365";
  const isYoga = brandTheme.brand === "yoga";
  const appGuideLabel = isFit365 ? "FIT365 APP" : isYoga ? "JOYFIT YOGA" : "JOYFIT APP";

  return (
    <div
      data-brand={brandTheme.brand}
      className={`${memberFormCardClass} text-foreground`}
      style={brandVars}
    >
      {submitting && (isLowSelected || (draft && isHigh)) ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/55 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-8 text-center shadow-xl">
            <p className="text-lg font-bold text-zinc-900">回答を保存しています</p>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
              この画面のまま、完了するまでお待ちください。
            </p>
          </div>
        </div>
      ) : null}
      <div className="joyfit-brand-header px-5 pb-7 pt-6 text-center text-white md:px-6 md:pt-8">
        <Link
          href={
            isYoga
              ? `${pathPrefix}/${brandTheme.brand}`
              : `${pathPrefix}/${brandTheme.brand}/select-store`
          }
          className="relative z-[1] mb-3 inline-block text-[13px] font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          {isYoga ? "← トップに戻る" : "← 店舗選択に戻る"}
        </Link>
        <h1 className="relative z-[1] mt-2 text-xl font-bold md:text-2xl">{storeName}</h1>
        <div className="relative z-[1] mx-auto mt-5 max-w-full text-center">
          <p className="inline-block rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[13px] font-semibold leading-tight text-white">
            {reward.rewardLabel}
          </p>
        </div>
      </div>

      <div className={memberFormBodyClass}>
        <section className={memberFormSectionClass}>
          <p className={memberFormSectionTitleClass}>会員情報の入力</p>

          <div className={memberFormGuideCardClass}>
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50/90 px-4 py-3">
                <span className="shrink-0 rounded-md bg-[color:var(--joyfit-red)] px-2.5 py-1 text-[12px] font-bold tracking-wide text-white">
                  {appGuideLabel}
                </span>
                <p className="text-[15px] font-semibold tracking-tight text-zinc-900">会員番号の確認・アプリ登録</p>
              </div>

              <div className="divide-y divide-zinc-100">
                <section className="relative px-4 py-4">
                  <div
                    className="absolute left-0 top-4 h-[calc(100%-2rem)] w-1 rounded-full bg-[color:var(--joyfit-red)]/85"
                    aria-hidden
                  />
                  <h3 className="pl-3 text-[13px] font-bold text-zinc-900">会員番号の確認（必須）</h3>
                  {isFit365 ? (
                    <p className="mt-2 pl-3 text-[13px] leading-relaxed text-zinc-600">
                      左上の<strong className="font-semibold text-zinc-800">三本線メニュー</strong>
                      をタップし、<strong className="font-semibold text-zinc-800">「契約情報」</strong>で
                      <strong className="text-[color:var(--joyfit-red)]">10桁の会員番号</strong>
                      をご確認ください。
                    </p>
                  ) : (
                    <p className="mt-2 pl-3 text-[13px] leading-relaxed text-zinc-600">
                      アプリ右上の<strong className="font-semibold text-zinc-800">「サービス」</strong>
                      →<strong className="font-semibold text-zinc-800">「契約情報」</strong>で、
                      <strong className="text-[color:var(--joyfit-red)]">10桁の会員番号</strong>をご確認ください。
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-2 items-stretch gap-2 sm:gap-3 pl-3">
                    <AppGuideScreenshot
                      step="01"
                      caption={isFit365 ? "左上の三本線をタップ" : "「サービス」をタップ"}
                      src={isFit365 ? "/fit365-app-member-2.png" : "/joyfit-app-member-1.png"}
                      alt={
                        isFit365
                          ? "FIT365アプリの左上メニューをタップする画面"
                          : "JOYFITアプリの右上「サービス」をタップする画面"
                      }
                    />
                    <AppGuideScreenshot
                      step="02"
                      caption={isFit365 ? "「契約情報」をタップ" : "「契約情報」で番号確認"}
                      src={isFit365 ? "/fit365-app-member-1.png" : "/joyfit-app-member-2.png"}
                      alt={
                        isFit365
                          ? "FIT365アプリで契約情報を開く画面"
                          : "契約情報画面で会員番号を確認する例"
                      }
                    />
                  </div>
                </section>

                {!isFit365 ? (
                  <section className="relative px-4 py-4">
                    <div
                      className="absolute left-0 top-4 h-[calc(100%-2rem)] w-1 rounded-full bg-orange-500/90"
                      aria-hidden
                    />
                    <h3 className="pl-3 text-[13px] font-bold text-zinc-900">JOYFITアプリ未登録の方</h3>
                    <p className="mt-2 pl-3 text-[13px] leading-relaxed text-zinc-600">
                      下記バナーから登録が可能です
                    </p>
                    <div className="mt-3 space-y-3 pl-3">
                      <a
                        href="https://procedure.joyfit.jp/qrcode2/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 w-full items-center justify-center rounded-xl bg-orange-500 text-[14px] font-semibold text-white shadow-sm transition hover:bg-orange-600"
                      >
                        アプリ登録ページを開く
                      </a>
                      <p className="text-[13px] leading-relaxed text-zinc-600">
                        ① お名前・生年月日・電話番号を入力
                        <br />
                        ②{" "}
                        <span className="font-semibold text-sky-700 underline decoration-sky-700/40 underline-offset-2">
                          「アプリアクティベート」
                        </span>
                        をタップ
                        <br />
                        ③ OK表示で登録完了
                      </p>
                      <div className="rounded-xl border border-orange-200/60 bg-orange-50/40 p-2">
                        <div className="grid grid-cols-2 items-stretch gap-2 sm:gap-3">
                          <AppGuideScreenshot
                            step="01"
                            caption="入力画面"
                            src="/joyfit-app-register-form.png"
                            alt="アプリ登録の会員検索入力画面"
                            variant="orange"
                          />
                          <AppGuideScreenshot
                            step="02"
                            caption="QR / アクティベート"
                            src="/joyfit-app-register-qr.png"
                            alt="アプリ登録のQRコード表示画面"
                            variant="orange"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>

          <MemberFormField
            label="会員番号（10桁）"
            required
            error={
              memberCode.length > 0 && !memberCodeOk
                ? "10桁そろうまで入力してください。"
                : null
            }
          >
            <Input
              className={memberFormInputClass}
              value={memberCode}
              inputMode="numeric"
              maxLength={10}
              placeholder="10桁の会員番号"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={memberCode.length > 0 && !memberCodeOk}
              onChange={(event) =>
                setMemberCode(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />
          </MemberFormField>

          <div
            className={`space-y-5 transition-opacity ${formFieldsLocked ? "pointer-events-none opacity-45" : ""}`}
            aria-disabled={formFieldsLocked}
          >

          <MemberFormField label="名前（フルネーム）" required>
            <Input
              className={memberFormInputClass}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="山田 太郎"
              autoComplete="name"
              disabled={formFieldsLocked}
            />
          </MemberFormField>

          <div>
            <p className={memberFormLabelClass}>
              性別<span className="text-[color:var(--joyfit-red)]"> *</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {genderOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGender(item)}
                  disabled={formFieldsLocked}
                  className={memberFormChoiceClass(gender === item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <MemberFormField label="年齢" required>
              <select
                value={ageRange}
                onChange={(event) => setAgeRange(event.target.value)}
                className={memberFormInputClass}
                disabled={formFieldsLocked}
              >
                <option value="">年齢を選択</option>
                {ageOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </MemberFormField>
            <MemberFormField label="メールアドレス" required>
              <Input
                type="email"
                className={memberFormInputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sample@example.com"
                autoComplete="email"
                disabled={formFieldsLocked}
              />
            </MemberFormField>
          </div>
          </div>
        </section>

        <section
          className={`${memberFormSectionDividerClass} text-center ${formFieldsLocked ? "pointer-events-none opacity-45" : ""}`}
        >
          <p className={`mb-4 ${memberFormSectionTitleClass}`}>アンケート評価（星をタップ）</p>
          {!isLowSelected ? (
            <RatingStars
              rating={rating ?? 0}
              interactive
              disabled={formFieldsLocked}
              onSelect={selectRating}
            />
          ) : null}
          {rating !== null && rating >= 4 && (
            <>
              <p className="mt-4 text-sm font-semibold text-zinc-900">
                {highRatingThankYouMessage(rating)}
              </p>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                {getHighRatingGoogleMapHint(rating)}
              </p>
            </>
          )}
          {isLowSelected && !sent && (
            <div className="mt-2 space-y-4">
              <p className="text-[15px] font-semibold leading-relaxed text-zinc-900">
                ご期待に沿えず申し訳ございません
              </p>
              <p className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-[15px] text-zinc-800">
                現在の選択評価{" "}
                <span className="font-bold text-[color:var(--joyfit-red)]">星{rating}</span>
              </p>
              <button
                type="button"
                onClick={() => setRating(null)}
                disabled={formFieldsLocked || submitting}
                className="text-[13px] font-medium text-zinc-500 underline underline-offset-2 transition hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                評価を選び直す
              </button>
              {submitError && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {submitError}
                </p>
              )}
              <Button
                onClick={() => void handleLowRatingSubmit()}
                disabled={!profileComplete || submitting}
                className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] focus-visible:ring-2 focus-visible:ring-zinc-400/40"
              >
                {submitting ? "保存中…" : LOW_RATING_SAVE_BUTTON_LABEL}
              </Button>
            </div>
          )}
          {isLowSelected && sent && sentKind === "low" && (
            <section className={`${memberFormSectionDividerClass} pt-8`}>
              <div className="overflow-hidden rounded-2xl border-2 border-[color:var(--joyfit-red)]/35 bg-white shadow-[0_8px_24px_-12px_rgba(165,53,75,0.35)]">
                <div className="joyfit-brand-header px-5 pb-7 pt-8 text-center text-white">
                  <div className="survey-success-icon mx-auto" aria-hidden>
                    <span className="survey-success-ring" />
                    <span className="survey-success-ring survey-success-ring--delay" />
                    <span className="survey-success-circle">
                      <Check className="survey-success-check h-7 w-7" strokeWidth={2.75} />
                    </span>
                  </div>
                  <h2 className="survey-success-fade-up mt-5 text-[18px] font-bold tracking-tight">
                    ご協力ありがとうございました
                  </h2>
                  <p className="survey-success-fade-up survey-success-fade-up--delay-1 mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-white/90">
                    回答を保存しました。
                  </p>
                </div>
                <div className="space-y-5 px-5 py-6">
                  <p className="text-[15px] font-semibold leading-relaxed text-zinc-900">
                    ご期待に沿えず申し訳ございません。
                    <br />
                    店舗担当へご意見をお聞かせください。
                  </p>
                  {(lowRatingGmailWebUrl || lowRatingMailtoUrl) ? (
                    <a
                      href={isTouchPhone() ? (lowRatingMailtoUrl ?? lowRatingGmailWebUrl!) : (lowRatingGmailWebUrl ?? lowRatingMailtoUrl!)}
                      target={isTouchPhone() ? undefined : "_blank"}
                      rel={isTouchPhone() ? undefined : "noopener noreferrer"}
                      className="survey-google-open-btn inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      Gmailで問い合わせる
                    </a>
                  ) : null}
                </div>
              </div>
            </section>
          )}
        </section>

        {canBuildGoogleDraft && (
          <section
            className={`${memberFormSectionDividerClass} ${formFieldsLocked ? "pointer-events-none opacity-45" : ""}`}
          >
            <div>
              <p className={memberFormSectionTitleClass}>よかった点を選んでください</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                ①②③の順に、それぞれ最大{MAX_PICKS_PER_SECTION}つずつタップしてください。
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--joyfit-red)] text-sm font-bold text-white">
                    1
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-zinc-900">
                      {reviewSectionLabels.service}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      最大{MAX_PICKS_PER_SECTION}つまで選べます（{menuPoints.length} /{" "}
                      {MAX_PICKS_PER_SECTION}）
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {shuffledMenuOptions.map((point) => (
                    <button
                      key={point}
                      type="button"
                      onClick={() => toggleMenuPoint(point)}
                      disabled={
                        !menuPoints.includes(point) &&
                        menuPoints.length >= MAX_PICKS_PER_SECTION
                      }
                      className={memberFormTagClass(menuPoints.includes(point))}
                    >
                      {point}
                    </button>
                  ))}
                </div>
              </div>

              {showReviewStep2 ? (
                <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--joyfit-red)] text-sm font-bold text-white">
                      2
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-zinc-900">
                        {reviewSectionLabels.environment}
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        最大{MAX_PICKS_PER_SECTION}つまで選べます（{envPoints.length} /{" "}
                        {MAX_PICKS_PER_SECTION}）
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {shuffledEnvOptions.map((point) => (
                      <button
                        key={point}
                        type="button"
                        onClick={() => toggleEnvPoint(point)}
                        disabled={
                          !envPoints.includes(point) &&
                          envPoints.length >= MAX_PICKS_PER_SECTION
                        }
                        className={memberFormTagClass(envPoints.includes(point))}
                      >
                        {point}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-3 text-[13px] text-muted-foreground">
                  ①を選ぶと、②{reviewSectionLabels.environment}が表示されます。
                </p>
              )}

              {showReviewStep3 ? (
                <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--joyfit-red)] text-sm font-bold text-white">
                      3
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-zinc-900">
                        {reviewSectionLabels.audience}
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        最大{MAX_PICKS_PER_SECTION}つまで選べます（{scenes.length} /{" "}
                        {MAX_PICKS_PER_SECTION}）
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {shuffledSceneOptions.map((scene) => (
                      <button
                        key={scene}
                        type="button"
                        onClick={() => toggleScene(scene)}
                        disabled={
                          !scenes.includes(scene) && scenes.length >= MAX_PICKS_PER_SECTION
                        }
                        className={memberFormTagClass(scenes.includes(scene))}
                      >
                        {scene}
                      </button>
                    ))}
                  </div>
                </div>
              ) : showReviewStep2 ? (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-3 text-[13px] text-muted-foreground">
                  ②を選ぶと、③{reviewSectionLabels.audience}が表示されます。
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-muted-foreground">
                その他、気に入っている点など（任意）
              </p>
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder=""
                rows={4}
                className={memberFormTextareaClass}
              />
            </div>

            <Button
              onClick={buildDraft}
              disabled={!profileComplete || !reviewPicksReady || submitting}
              className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] focus-visible:ring-2 focus-visible:ring-zinc-400/40"
            >
              アンケート内容を確認する
            </Button>
            {!reviewPicksReady && profileComplete && (
              <p className="text-[13px] text-muted-foreground">
                ※ ①②③それぞれ1つ以上選ぶと、文章を作成できます。
              </p>
            )}
            {!profileComplete && memberCodeOk && (
              <p className="text-[13px] text-muted-foreground">※ 会員情報の必須項目を入力してください。</p>
            )}
          </section>
        )}

        {draft && isHigh && (
          <section className={`${memberFormSectionDividerClass} pt-8`}>
            <div className="overflow-hidden rounded-2xl border-2 border-[color:var(--joyfit-red)]/35 bg-white shadow-[0_8px_24px_-12px_rgba(165,53,75,0.35)]">
              <div className="joyfit-brand-header px-5 pb-7 pt-8 text-center text-white">
                <div className="survey-success-icon mx-auto" aria-hidden>
                  <span className="survey-success-ring" />
                  <span className="survey-success-ring survey-success-ring--delay" />
                  <span className="survey-success-circle">
                    <Check className="survey-success-check h-7 w-7" strokeWidth={2.75} />
                  </span>
                </div>
                <h2 className="survey-success-fade-up mt-5 text-[18px] font-bold tracking-tight">
                  {sent ? SURVEY_COMPLETION_THANK_YOU : SURVEY_COMPLETION_REVIEW_PREFACE_TITLE}
                </h2>
                <p className="survey-success-fade-up survey-success-fade-up--delay-1 mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-white/90">
                  {sent ? "回答を保存しました。" : SURVEY_REWARD_GRANT_NOTE}
                </p>
              </div>

              <div className="space-y-5 px-5 py-6">
                <div className="text-center">
                  <div className="mt-1">
                    <RatingStars rating={rating ?? 0} emptyStarClass="text-zinc-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-900">
                    {highRatingThankYouMessage(rating ?? 0)}
                  </p>
                  {!sent ? (
                    <p className="mt-1.5 text-[13px] text-zinc-500">
                      {getHighRatingGoogleMapHint(rating ?? 0)}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="mb-2 text-[12px] font-bold tracking-wide text-[color:var(--joyfit-red-dark)]">
                    ご回答内容の確認（修正できます）
                  </p>
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    readOnly={sent}
                    rows={7}
                    className={`${memberFormTextareaClass} leading-[1.75]`}
                  />
                </div>

                {!sent ? (
                  <GooglePostConsentPanel
                    rating={rating ?? 0}
                    draft={draft}
                    consents={googlePostConsents}
                    onToggle={toggleGooglePostConsent}
                  />
                ) : null}

                {submitError && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[14px] font-semibold leading-relaxed text-destructive">
                    保存できませんでした。{submitError}
                  </p>
                )}

                {sent ? (
                  <div className="space-y-4">
                    <p className="text-center text-[14px] font-semibold leading-relaxed text-zinc-800">
                      回答を保存しました
                    </p>
                    <p className="text-center text-[13px] leading-relaxed text-zinc-500">
                      下のボタンからGoogleマップへ進んでください。
                      <br />
                      {SURVEY_COMPLETION_POINT_PENDING_NOTE_LINES[0]}
                      <br />
                      {SURVEY_COMPLETION_POINT_PENDING_NOTE_LINES[1]}
                    </p>
                    {reviewUrl.trim() ? (
                      <a
                        href={reviewUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          void navigator.clipboard.writeText(draft.trim()).catch(() => {});
                        }}
                        className="survey-google-open-btn inline-flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--joyfit-red)] px-4 text-[15px] font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)]"
                      >
                        {REVIEW_GOOGLE_POST_OPEN_BUTTON_LABEL}
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void saveHighRatingSurvey()}
                    disabled={submitting || !googlePostReady}
                    className="survey-google-open-btn relative z-10 h-12 w-full cursor-pointer rounded-xl border-0 bg-[color:var(--joyfit-red)] text-[15px] font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                  >
                    {submitting ? "保存中…" : REVIEW_GOOGLE_POST_SUBMIT_BUTTON_LABEL}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
