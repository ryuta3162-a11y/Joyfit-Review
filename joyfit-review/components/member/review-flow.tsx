"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import { Mail, Star } from "lucide-react";

import { submitMemberSurvey } from "@/app/actions/submit-member-survey";
import { fetchCheckRespondent, type CheckSurveyRespondentResult } from "@/lib/survey-respondent-check";
import { AppGuideScreenshot } from "@/components/member/app-guide-screenshot";
import { MemberFormField } from "@/components/member/member-form-field";
import {
  memberFormCardClass,
  memberFormChoiceClass,
  memberFormGuideCardClass,
  memberFormInputClass,
  memberFormLabelClass,
  memberFormPanelClass,
  memberFormSectionTitleClass,
  memberFormTagClass,
  memberFormTextareaClass,
} from "@/components/member/member-form-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandCssVars, getBrandTheme } from "@/lib/brand";
import { STORE_REWARD_VARIES_NOTE, type StoreRewardDisplay } from "@/lib/store-reward";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  storeId: string;
  storeName: string;
  reviewUrl: string;
  /** 店舗マスタの通知先。空のときは DEFAULT_LOW_RATING_EMAIL を使用 */
  feedbackEmail: string;
  reward: StoreRewardDisplay;
  /** 会員番号重複確認用 GAS URL（クライアントから直接照会して応答を短縮） */
  respondentCheckGasUrl?: string;
};

const stars = [1, 2, 3, 4, 5];
const genderOptions = ["男性", "女性", "その他"] as const;
const ageOptions = ["10代", "20代", "30代", "40代", "50代", "60代以上"] as const;
const menuServiceOptions = [
  "24時間いつでも通える",
  "年中無休で利用しやすい",
  "全国のJOYFITを相互利用可能",
  "初心者向けのオリエンテーション",
  "マシンの使い方を丁寧にサポート",
  "スタッフによる丁寧なサポート",
  "パーソナルトレーニング対応",
  "目的別のトレーニング相談が可能",
  "本格的なフリーウエイト設備",
  "使いやすいスミスマシン",
  "有酸素マシンが豊富で使いやすい",
] as const;
const environmentOptions = [
  "駅・周辺から通いやすい立地",
  "24時間安心のセキュリティ",
  "清掃が行き届いた清潔な館内",
  "落ち着いて集中できる環境",
  "整理整頓されたマシンエリア",
  "無料の鍵付きロッカー設置",
  "全館フリーWi-Fi完備",
  "土足利用可能で手間なく通える",
  "広々としたストレッチエリア",
] as const;
const sceneOptions = [
  "24時間ジムを探している方に",
  "自分のペースでトレーニング",
  "仕事帰りにサクッと筋トレ",
  "運動不足にお悩みの方に",
  "スキマ時間に体を動かしたい",
  "運動でストレス発散したい方に",
  "安心安全に夜間利用したい",
  "理想の体型を目指したい方に",
  "健康維持にジムを使いたい",
  "全国のJOYFITを活用したい方に",
] as const;
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

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
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:${to}?${params.toString()}`;
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

const respondentCheckCache = new Map<string, CheckSurveyRespondentResult>();

export function ReviewFlow({
  storeId,
  storeName,
  reviewUrl,
  feedbackEmail,
  reward,
  respondentCheckGasUrl,
}: Props) {
  const brandTheme = useMemo(() => getBrandTheme(storeName), [storeName]);
  const brandVars = useMemo(() => brandCssVars(brandTheme), [brandTheme]);
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [respondentCheck, setRespondentCheck] = useState<{
    status: "idle" | "checking" | "eligible" | "already" | "error";
    errorMessage?: string;
  }>({ status: "idle" });
  /** 送信ボタン1回分のID。エラー時の再送は同じIDで冪等に処理する */
  const submissionIdRef = useRef<string | null>(null);
  const checkRequestIdRef = useRef(0);

  const memberCodeOk = useMemo(() => /^\d{10}$/.test(memberCode.trim()), [memberCode]);
  const alreadyAnswered = respondentCheck.status === "already";
  const respondentCheckFailed = respondentCheck.status === "error";
  const respondentCheckPending = respondentCheck.status === "checking";
  /** 会員番号の重複確認が通ったら、下の項目を入力可能にする */
  const memberVerified = memberCodeOk && respondentCheck.status === "eligible";
  const formFieldsLocked = !memberVerified && !alreadyAnswered;

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
    const code = memberCode.trim();
    const codeReady = /^\d{10}$/.test(code) && !/^0{10}$/.test(code);
    if (!codeReady) {
      setRespondentCheck({ status: "idle" });
      return;
    }

    const cached = respondentCheckCache.get(code);
    if (cached) {
      if (cached.ok && cached.eligible === false) {
        setRespondentCheck({ status: "already" });
      } else if (cached.ok) {
        setRespondentCheck({ status: "eligible" });
      } else {
        setRespondentCheck({
          status: "error",
          errorMessage: cached.gasOutdated
            ? "重複確認が利用できません。GASを最新の Code.gs で「新しいバージョン」として再デプロイしてください。"
            : cached.error || "回答状況を確認できませんでした。",
        });
      }
      return;
    }

    setRespondentCheck({ status: "checking" });
    const requestId = ++checkRequestIdRef.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = respondentCheckGasUrl
          ? await fetchCheckRespondent(respondentCheckGasUrl, code)
          : ({ ok: false, error: "ただいま確認をお受けできません。" } as const);
        if (requestId !== checkRequestIdRef.current) return;

        respondentCheckCache.set(code, result);

        if (result.ok && result.eligible === false) {
          setRespondentCheck({ status: "already" });
          return;
        }
        if (result.ok) {
          setRespondentCheck({ status: "eligible" });
          return;
        }
        setRespondentCheck({
          status: "error",
          errorMessage: result.gasOutdated
            ? "重複確認が利用できません。GASを最新の Code.gs で「新しいバージョン」として再デプロイしてください。"
            : result.error || "回答状況を確認できませんでした。",
        });
      })();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [memberCode, respondentCheckGasUrl]);

  const isHigh = useMemo(() => (rating ?? 0) >= 4, [rating]);
  const canBuildGoogleDraft = (rating ?? 0) >= 4;
  const isLowSelected = rating !== null && !isHigh;

  function selectRating(value: number) {
    if (formFieldsLocked || alreadyAnswered || respondentCheckPending) return;
    setRating(value);
    if (value < 4) {
      setDraft("");
    }
  }

  function toggleList(point: string, setter: Dispatch<SetStateAction<string[]>>) {
    setter((current) =>
      current.includes(point) ? current.filter((item) => item !== point) : [...current, point],
    );
  }

  function toggleScene(scene: string) {
    setScenes((current) => {
      if (current.includes(scene)) return current.filter((item) => item !== scene);
      if (current.length >= 3) return current;
      return [...current, scene];
    });
  }

  const allPositives = useMemo(() => [...menuPoints, ...envPoints], [menuPoints, envPoints]);
  const profileComplete =
    memberVerified &&
    fullName.trim() &&
    gender &&
    ageRange &&
    email.trim() &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    memberCodeOk;

  function buildDraft() {
    if (!rating || !profileComplete || alreadyAnswered) return;

    const picked = allPositives.slice(0, 3);
    const sceneLine = scenes.length ? `おすすめの利用シーン: ${scenes.join("、")}` : "";
    const goodPoints =
      picked.length > 0
        ? `良かった点は、${picked.join("、")}です。`
        : "館内が使いやすく、継続して通いやすいと感じました。";
    const extra = feedback.trim();

    const body = [
      goodPoints,
      sceneLine,
      extra,
      "今後も継続して利用したいと思います。",
    ]
      .filter(Boolean)
      .join("\n");

    setDraft(body);
  }

  async function submitSurvey(payloadReview: string) {
    if (!rating || !profileComplete) return { ok: false as const, error: "必須項目を入力してください。" };
    if (alreadyAnswered) {
      return { ok: false as const, error: "すでに回答済みです" };
    }
    if (!memberVerified) {
      return { ok: false as const, error: "会員番号の確認が完了していません。" };
    }
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
    });
  }

  async function copyDraftAndOpen() {
    if (!draft || submitting || sent) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitSurvey(draft);
    if (!result.ok) {
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    try {
      await navigator.clipboard.writeText(draft);
    } catch {
      // クリップボード制限のある環境でも、投稿導線は止めない
    }
    setSentKind("high");
    setSent(true);
    setSubmitting(false);
    window.open(reviewUrl, "_blank", "noopener,noreferrer");
  }

  function getLowRatingContactDraft() {
    if (!rating || rating >= 4) return;
    const recipients = feedbackEmail
      .split(/[,\s;]+/)
      .map((v) => v.trim())
      .filter((v) => v.includes("@"));
    if (!recipients.length) {
      setSubmitError("店舗の問い合わせ先メールが未設定です。");
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
    };
  }

  async function handleLowRatingSubmit() {
    if (!rating || rating >= 4 || submitting || sent) return;
    const mailDraft = getLowRatingContactDraft();
    if (!mailDraft) return;

    setSubmitting(true);
    setSubmitError(null);
    const result = await submitSurvey("");
    if (!result.ok) {
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }
    setLowRatingMailtoUrl(mailDraft.mailtoUrl);
    setSentKind("low");
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div data-brand={brandTheme.brand} className={memberFormCardClass} style={brandVars}>
        <div className="joyfit-brand-header px-6 py-10 text-center text-white">
          {sentKind === "high" ? (
            <>
              <p className="text-4xl">🙏</p>
              <h2 className="mt-4 text-xl font-bold">ご協力ありがとうございました</h2>
              <p className="mx-auto mt-3 max-w-xs text-[15px] text-white/95">
                回答を保存しました。Google口コミページで投稿をお願いします。
              </p>
            </>
          ) : (
            <div className="mx-auto max-w-sm space-y-4">
              <h2 className="text-xl font-bold">回答を保存しました</h2>
              <p className="text-[15px] leading-relaxed text-white/95">
                下記お問い合わせバナーから
                <br />
                ご意見を送信してください。
              </p>
              {lowRatingMailtoUrl ? (
                <a
                  href={lowRatingMailtoUrl}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/50 bg-white px-4 text-[15px] font-semibold text-[color:var(--joyfit-red-dark)] shadow-sm transition hover:bg-white/95"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  メールアプリで問い合わせる
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (alreadyAnswered) {
    return (
      <div data-brand={brandTheme.brand} className={memberFormCardClass} style={brandVars}>
        <div className="joyfit-brand-header px-6 py-10 text-center text-white">
          <p className="text-4xl">✓</p>
          <h2 className="mt-4 text-xl font-bold">すでに回答済みです</h2>
          <p className="mx-auto mt-3 max-w-xs text-[15px] text-white/95">
            ご協力ありがとうございました。
          </p>
        </div>
      </div>
    );
  }

  const isFit365 = brandTheme.brand === "fit365";

  return (
    <div
      data-brand={brandTheme.brand}
      className={`${notoSansJp.className} ${memberFormCardClass} text-foreground`}
      style={brandVars}
    >
      <div className="joyfit-brand-header px-5 pb-7 pt-6 text-center text-white md:px-6 md:pt-8">
        <Link
          href={`/${brandTheme.brand}/select-store`}
          className="relative z-[1] mb-3 inline-block text-[13px] font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          ← 店舗選択に戻る
        </Link>
        <h1 className="relative z-[1] mt-2 text-xl font-bold md:text-2xl">{storeName}</h1>
        <div className="relative z-[1] mx-auto mt-5 max-w-full text-center">
          <p className="inline-block rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[13px] font-semibold leading-tight text-white">
            {reward.rewardLabel}
          </p>
          {reward.rewardPointLearnMoreUrl && reward.rewardPointLearnMoreLabel ? (
            <a
              href={reward.rewardPointLearnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-[13px] font-medium text-white/90 underline underline-offset-2 transition hover:text-white"
            >
              {reward.rewardPointLearnMoreLabel}
            </a>
          ) : null}
          <p className="mt-2 text-[12px] leading-relaxed text-white/80">{STORE_REWARD_VARIES_NOTE}</p>
        </div>
      </div>

      <div className="space-y-8 border-t border-zinc-200/80 bg-gradient-to-b from-zinc-50/90 to-white p-5 md:p-8">
        <div className={`space-y-5 ${memberFormPanelClass}`}>
          <p className={memberFormSectionTitleClass}>会員情報の入力</p>

          <div className={memberFormGuideCardClass}>
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50/90 px-4 py-3">
                <span className="shrink-0 rounded-md bg-[color:var(--joyfit-red)] px-2.5 py-1 text-[12px] font-bold tracking-wide text-white">
                  {isFit365 ? "FIT365 APP" : "JOYFIT APP"}
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
            {respondentCheckPending && memberCodeOk && (
              <p className="mt-1.5 text-[13px] text-muted-foreground">情報を確認しています…</p>
            )}
            {memberVerified && (
              <p className="mt-1.5 text-[13px] font-medium text-emerald-800">
                会員番号を確認しました。以下の項目に進めます。
              </p>
            )}
            {respondentCheckFailed && respondentCheck.errorMessage && (
              <p className="mt-1.5 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-950">
                {respondentCheck.errorMessage}
              </p>
            )}
          </MemberFormField>

          <div
            className={`space-y-5 transition-opacity ${formFieldsLocked ? "pointer-events-none opacity-45" : ""}`}
            aria-disabled={formFieldsLocked}
          >
            {!memberVerified && memberCodeOk && !respondentCheckPending && !alreadyAnswered && (
              <p className="text-[13px] text-muted-foreground">
                会員番号の確認が完了すると、名前・評価などの入力欄が使えるようになります。
              </p>
            )}

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
                  onClick={() => memberVerified && setGender(item)}
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
        </div>

        <section
          className={`${memberFormPanelClass} text-center ${formFieldsLocked ? "pointer-events-none opacity-45" : ""}`}
        >
          <p className={`mb-4 ${memberFormSectionTitleClass}`}>口コミ評価（星をタップ）</p>
          <RatingStars
            rating={rating ?? 0}
            interactive
            disabled={formFieldsLocked}
            onSelect={selectRating}
          />
          {rating !== null && rating >= 4 && (
            <>
              <p className="mt-4 text-sm font-semibold text-zinc-900">
                {highRatingThankYouMessage(rating)}
              </p>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                投稿時は同じ評価（星{rating}）を選択してください。
              </p>
            </>
          )}
          {isLowSelected && (
            <div className="mt-4 space-y-4">
              <p className="text-[15px] font-semibold leading-relaxed text-zinc-900">
                今後のサービス向上のため
                <br />
                店舗へお問い合わせください
              </p>
              {submitError && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {submitError}
                </p>
              )}
              <Button
                onClick={() => void handleLowRatingSubmit()}
                disabled={!profileComplete || submitting || sent || alreadyAnswered}
                className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] focus-visible:ring-2 focus-visible:ring-zinc-400/40"
              >
                <Mail className="h-4 w-4" />
                {submitting
                  ? "保存中…"
                  : sent
                    ? "送信済み"
                    : alreadyAnswered
                      ? "回答済み"
                      : "Gmailでお問い合わせ"}
              </Button>
            </div>
          )}
        </section>

        {canBuildGoogleDraft && (
          <div
            className={`space-y-4 ${memberFormPanelClass} bg-gradient-to-b from-zinc-50/40 to-white ${formFieldsLocked ? "pointer-events-none opacity-45" : ""}`}
          >
            <p className={memberFormSectionTitleClass}>よかった点を教えてください（複数選択可）</p>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted-foreground">
                1. メニュー・サービスで良かった点
              </p>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {menuServiceOptions.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => toggleList(point, setMenuPoints)}
                    className={memberFormTagClass(menuPoints.includes(point))}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted-foreground">2. 環境・設備で良かった点</p>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {environmentOptions.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => toggleList(point, setEnvPoints)}
                    className={memberFormTagClass(envPoints.includes(point))}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-muted-foreground">
                3. おすすめの利用シーン（最大3つ）
              </p>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {sceneOptions.map((scene) => (
                  <button
                    key={scene}
                    type="button"
                    onClick={() => toggleScene(scene)}
                    className={memberFormTagClass(scenes.includes(scene))}
                  >
                    {scene}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">選択中: {scenes.length} / 3</p>
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
              disabled={!profileComplete || submitting || alreadyAnswered}
              className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] focus-visible:ring-2 focus-visible:ring-zinc-400/40"
            >
              口コミ用に文章を作成する
            </Button>
            {!memberVerified && (
              <p className="text-[13px] text-muted-foreground">※ 先に会員番号の確認を完了してください。</p>
            )}
            {memberVerified && !profileComplete && (
              <p className="text-[13px] text-muted-foreground">※ 会員情報の必須項目を入力してください。</p>
            )}
          </div>
        )}

        {draft && isHigh && (
          <div className="space-y-5">
            <section className={`${memberFormPanelClass} text-center`}>
              <div className="flex flex-col items-center gap-1">
                <Image
                  src="/google-logo.png"
                  alt="Google ロゴ"
                  width={140}
                  height={46}
                  className="h-auto w-[140px]"
                />
              </div>
              <div className="mt-4">
                <RatingStars rating={rating ?? 0} emptyStarClass="text-zinc-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-zinc-900">
                {highRatingThankYouMessage(rating ?? 0)}
              </p>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                投稿時は同じ評価（星{rating}）を選択してください。
              </p>
              <div className="mt-5 border-t border-zinc-100 pt-5">
                <p
                  className="flex w-full items-center justify-center rounded-lg border-2 border-[color:var(--joyfit-red-dark)] bg-[color:var(--joyfit-red)] px-4 py-3.5 text-center text-sm font-bold leading-snug text-white shadow-[0_3px_0_rgba(0,0,0,0.18),0_8px_20px_rgba(0,0,0,0.12)] md:text-[15px]"
                  role="status"
                >
                  コピー用文面〔こちらで添削可能です〕
                </p>
              </div>
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={7}
                className={`mt-3 ${memberFormTextareaClass} leading-[1.75]`}
              />
            </section>

            <p className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm leading-relaxed text-zinc-700">
              コピー用文面は口コミページ移動時、自動でコピーされます。
              <br />
              そのまま貼り付けてください。
            </p>

            {submitError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                {submitError}
              </p>
            )}
            <Button
              onClick={() => void copyDraftAndOpen()}
              disabled={submitting || sent || alreadyAnswered || !memberVerified}
              className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] focus-visible:ring-2 focus-visible:ring-[color:var(--joyfit-red)]/30"
            >
              {submitting ? "保存中…" : sent ? "送信済み" : alreadyAnswered ? "回答済み" : "口コミを投稿する"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
