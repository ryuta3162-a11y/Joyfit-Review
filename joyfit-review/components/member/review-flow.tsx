"use client";

import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import Image from "next/image";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import { Copy, ExternalLink, Mail, Star } from "lucide-react";

import { submitMemberSurvey } from "@/app/actions/submit-member-survey";
import { JoyfitHeaderLogo } from "@/components/joyfit/header-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENJOY_POINT_REWARD_LABEL } from "@/lib/member-reward-copy";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  storeId: string;
  storeName: string;
  reviewUrl: string;
  /** 店舗マスタの通知先。空のときは DEFAULT_LOW_RATING_EMAIL を使用 */
  feedbackEmail: string;
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
  "経堂駅から徒歩圏内の好立地",
  "24時間安心のセキュリティ",
  "清掃が行き届いた清潔な館内",
  "落ち着いて集中できる環境",
  "整理整頓されたマシンエリア",
  "個室シャワールーム完備",
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

export function ReviewFlow({ storeId, storeName, reviewUrl, feedbackEmail }: Props) {
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
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [contactCopied, setContactCopied] = useState(false);

  const isHigh = useMemo(() => (rating ?? 0) >= 4, [rating]);
  const canBuildGoogleDraft = (rating ?? 0) >= 4;
  const isLowSelected = rating !== null && !isHigh;
  const fieldClass =
    "h-11 rounded-xl border-zinc-300 bg-white shadow-sm focus-visible:border-[color:var(--joyfit-red)] focus-visible:ring-2 focus-visible:ring-[color:var(--joyfit-red)]/20";
  const areaClass =
    "rounded-xl border-zinc-300 bg-white shadow-sm focus-visible:border-[color:var(--joyfit-red)] focus-visible:ring-2 focus-visible:ring-[color:var(--joyfit-red)]/20";
  const labelClass = "mb-1.5 text-[13px] font-semibold tracking-tight text-zinc-700";

  function selectRating(value: number) {
    setRating(value);
    if (value < 4) {
      setDraft("");
      setCopied(false);
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
  const memberCodeOk = useMemo(() => /^\d{10}$/.test(memberCode.trim()), [memberCode]);
  const profileComplete =
    fullName.trim() &&
    gender &&
    ageRange &&
    email.trim() &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    memberCodeOk;

  function buildDraft() {
    if (!rating || !profileComplete) return;

    const picked = allPositives.slice(0, 3);
    const sceneLine = scenes.length ? `おすすめの利用シーン: ${scenes.join("、")}` : "";
    const goodPoints =
      picked.length > 0
        ? `良かった点は、${picked.join("、")}です。`
        : "館内が使いやすく、継続して通いやすいと感じました。";
    const extra = feedback.trim();

    const body = [
      `${storeName}を利用しました。`,
      `星${rating}の評価です。`,
      goodPoints,
      sceneLine,
      extra,
      "今後も継続して利用したいです。",
    ]
      .filter(Boolean)
      .join("\n");

    setDraft(body);
    setCopied(false);
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
    });
  }

  async function copyDraftAndOpen() {
    if (!draft) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitSurvey(draft);
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setCopied(false);
    }
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
    const body = [
      `店舗名: ${storeName}`,
      `評価: 星${rating ?? ""}`,
      `氏名: ${fullName.trim()}`,
      `会員番号: ${memberCode.trim()}`,
      `メールアドレス: ${email.trim()}`,
      "",
      "--- ご要望 / お声 ---",
      "▼下記に内容をご記入ください▼",
      "（気になった点 / ご要望 / 改善してほしい点 など）",
      "",
      "------------------------------",
      "今後のサービス向上の為、素直なご意見をいただければ幸いです。",
    ].join("\n");
    return {
      to,
      subject,
      body,
      mailtoUrl: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      gmailWebUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    };
  }

  async function handleLowRatingSubmit(mode: "mailto" | "gmailWeb") {
    if (!rating || rating >= 4) return;
    setSubmitting(true);
    setSubmitError(null);
    setContactCopied(false);
    const result = await submitSurvey("");
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    const draft = getLowRatingContactDraft();
    if (!draft) return;
    if (mode === "mailto") {
      window.location.href = draft.mailtoUrl;
      return;
    }
    window.open(draft.gmailWebUrl, "_blank", "noopener,noreferrer");
  }

  async function copyLowRatingContactDraft() {
    if (!rating || rating >= 4 || !profileComplete) return;
    const draft = getLowRatingContactDraft();
    if (!draft) return;
    const text = [
      `宛先: ${draft.to}`,
      `件名: ${draft.subject}`,
      "",
      draft.body,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setContactCopied(true);
      setSubmitError(null);
    } catch {
      setSubmitError("コピーに失敗しました。");
    }
  }

  if (sent) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="joyfit-brand-header px-6 py-10 text-center text-white">
          <p className="text-4xl">🙏</p>
          <h2 className="mt-4 text-xl font-bold">ご協力ありがとうございました</h2>
          <p className="mx-auto mt-3 max-w-xs text-sm text-white/95">
            ご意見を担当者へお送りしました。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${notoSansJp.className} overflow-hidden rounded-2xl border border-zinc-200 bg-white text-foreground shadow-sm`}>
      <div className="joyfit-brand-header px-5 pb-6 pt-6 text-center text-white md:px-6 md:pt-8">
        <Link
          href="/select-store"
          className="relative z-[1] mb-3 inline-block text-xs font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          ← 店舗選択に戻る
        </Link>
        <JoyfitHeaderLogo className="mb-1" />
        <h1 className="relative z-[1] mt-3 text-xl font-bold md:text-2xl">{storeName}</h1>
        <p className="relative z-[1] mt-2 text-sm text-white/90">本日のトレーニングのご感想をお聞かせください</p>
        <p className="relative z-[1] mt-3 inline-block rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white">
          特典：{ENJOY_POINT_REWARD_LABEL}
        </p>
      </div>

      <div className="space-y-7 border-t border-zinc-200/80 bg-gradient-to-b from-zinc-50/90 to-white p-5 md:p-6">
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">会員情報の入力</p>
          <div>
            <p className={labelClass}>名前（フルネーム）*</p>
            <Input className={fieldClass} value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-[color:var(--joyfit-red)]/25 bg-gradient-to-br from-white via-white to-[color:var(--joyfit-red)]/[0.06] shadow-sm ring-1 ring-zinc-100">
              <div className="flex items-center gap-2 border-b border-[color:var(--joyfit-red)]/15 bg-[color:var(--joyfit-red)]/10 px-3 py-2.5">
                <span className="shrink-0 rounded-md bg-[color:var(--joyfit-red)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                  JOYFIT APP
                </span>
                <p className="text-xs font-bold leading-tight text-zinc-900">会員番号の確認手順（必須）</p>
              </div>
              <div className="space-y-2 px-3 py-2.5">
                <p className="text-[11px] leading-relaxed text-zinc-700">
                  アプリを開き、右上の<strong>「サービス」</strong>→<strong>「契約情報」</strong>の順で進むと、
                  <strong className="text-[color:var(--joyfit-red)]">10桁の会員番号</strong>が表示されます。
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <figure className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm">
                    <figcaption className="flex items-center gap-1.5 border-b border-zinc-200 bg-white px-2 py-1.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-zinc-900 text-[9px] font-bold text-white">
                        01
                      </span>
                      <span className="text-[10px] font-semibold leading-tight text-zinc-700">「サービス」をタップ</span>
                    </figcaption>
                    <div className="relative aspect-[9/16] max-h-[220px] w-full bg-white">
                      <Image
                        src="/joyfit-app-member-1.png"
                        alt="JOYFITアプリの右上「サービス」をタップする画面"
                        fill
                        className="object-contain object-top p-1"
                        sizes="(max-width: 640px) 45vw, 200px"
                      />
                    </div>
                  </figure>
                  <figure className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm">
                    <figcaption className="flex items-center gap-1.5 border-b border-zinc-200 bg-white px-2 py-1.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-zinc-900 text-[9px] font-bold text-white">
                        02
                      </span>
                      <span className="text-[10px] font-semibold leading-tight text-zinc-700">「契約情報」で番号確認</span>
                    </figcaption>
                    <div className="relative aspect-[9/16] max-h-[220px] w-full bg-white">
                      <Image
                        src="/joyfit-app-member-2.png"
                        alt="契約情報画面で会員番号を確認する例"
                        fill
                        className="object-contain object-top p-1"
                        sizes="(max-width: 640px) 45vw, 200px"
                      />
                    </div>
                  </figure>
                </div>

                <div className="overflow-hidden rounded-2xl border border-orange-300/70 bg-gradient-to-br from-orange-50 via-white to-orange-50/70 shadow-sm ring-1 ring-orange-100">
                  <div className="flex items-center gap-2 border-b border-orange-200 bg-orange-100/80 px-3 py-2.5">
                    <span className="shrink-0 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                      JOYFIT APP
                    </span>
                    <p className="text-xs font-bold leading-tight text-zinc-900">アプリ登録手順（未登録の方向け）</p>
                  </div>
                  <div className="space-y-2 px-3 py-2.5">
                  <a
                    href="https://procedure.joyfit.jp/qrcode2/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-semibold text-white hover:bg-orange-600"
                  >
                    アプリ登録していない方はこちらをタップ
                  </a>
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-700">
                    ① お名前・生年月日・電話番号を入力
                    <br />
                    ②{" "}
                    <span className="font-bold text-sky-600 underline decoration-2 underline-offset-2">
                      水色の「アプリアクティベート」
                    </span>
                    をタップして開く
                    <br />
                    ③ OKになれば登録完了
                  </p>
                  <div className="mt-2 rounded-xl bg-orange-50 p-2">
                    <div className="grid grid-cols-2 gap-2">
                    <figure className="overflow-hidden rounded-xl bg-orange-50 shadow-sm ring-1 ring-orange-200/70">
                      <figcaption className="border-b border-orange-200/70 bg-orange-100 px-2 py-1 text-[10px] font-semibold text-zinc-700">
                        01 入力画面
                      </figcaption>
                      <div className="relative aspect-[9/16] w-full bg-orange-50">
                        <Image
                          src="/joyfit-app-register-form.png"
                          alt="アプリ登録の会員検索入力画面"
                          fill
                          className="object-contain object-top"
                          sizes="(max-width: 640px) 45vw, 200px"
                        />
                      </div>
                    </figure>
                    <figure className="overflow-hidden rounded-xl bg-orange-50 shadow-sm ring-1 ring-orange-200/70">
                      <figcaption className="border-b border-orange-200/70 bg-orange-100 px-2 py-1 text-[10px] font-semibold text-zinc-700">
                        02 QR/アクティベート
                      </figcaption>
                      <div className="relative aspect-[9/16] w-full bg-orange-50">
                        <Image
                          src="/joyfit-app-register-qr.png"
                          alt="アプリ登録のQRコード表示画面"
                          fill
                          className="object-contain object-top"
                          sizes="(max-width: 640px) 45vw, 200px"
                        />
                      </div>
                    </figure>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className={labelClass}>会員番号（10桁・必須）*</p>
              <Input
                className={fieldClass}
                value={memberCode}
                inputMode="numeric"
                maxLength={10}
                placeholder="0123456789"
                onChange={(event) =>
                  setMemberCode(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                aria-invalid={memberCode.length > 0 && !memberCodeOk}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">半角数字10桁（ハイフンは入れないでください）</p>
              {memberCode.trim().length === 0 ? (
                <p className="mt-1 text-[11px] font-medium text-amber-800">会員番号の入力は必須です。</p>
              ) : !memberCodeOk ? (
                <p className="mt-1 text-[11px] font-medium text-[color:var(--joyfit-red)]">
                  10桁そろうまで入力してください。
                </p>
              ) : null}
            </div>
          </div>
          <div>
            <p className={labelClass}>性別*</p>
            <div className="grid grid-cols-3 gap-2">
              {genderOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGender(item)}
                  className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold transition ${
                    gender === item
                      ? "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white"
                      : "border-zinc-200 bg-zinc-50 text-foreground hover:border-zinc-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={labelClass}>年齢*</p>
              <select
                value={ageRange}
                onChange={(event) => setAgeRange(event.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-[color:var(--joyfit-red)] focus:ring-2 focus:ring-[color:var(--joyfit-red)]/20"
              >
                <option value="">- 年齢を選択してください -</option>
                {ageOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>メールアドレス*</p>
              <Input
                type="email"
                className={fieldClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sample@example.com"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-zinc-900">満足度（星をタップ）</p>
          <div className="flex flex-wrap justify-center gap-1 sm:justify-start">
            {stars.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => selectRating(value)}
                className="rounded-lg p-1.5 transition hover:bg-primary/10"
                aria-label={`${value}つ星`}
              >
                <Star
                  className={`h-9 w-9 sm:h-10 sm:w-10 ${value <= (rating ?? 0) ? "fill-[color:var(--joyfit-red)] text-[color:var(--joyfit-red)]" : "text-zinc-300"}`}
                />
              </button>
            ))}
          </div>
          {rating && (
            <p className="mt-2 text-xs font-semibold text-[color:var(--joyfit-red)]">
              選択中の評価: 星{rating}
            </p>
          )}
        </div>

        {canBuildGoogleDraft && (
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/90 p-5 shadow-sm">
            <p className="text-sm font-semibold text-foreground">よかった点を教えてください（複数選択可）</p>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                1. メニュー・サービスで良かった点
              </p>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {menuServiceOptions.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => toggleList(point, setMenuPoints)}
                    className={`rounded-xl border-2 px-3 py-3 text-[11px] font-semibold leading-snug transition ${
                      menuPoints.includes(point)
                        ? "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-sm"
                        : "border-zinc-200 bg-white text-foreground shadow-sm ring-1 ring-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">2. 環境・設備で良かった点</p>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {environmentOptions.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => toggleList(point, setEnvPoints)}
                    className={`rounded-xl border-2 px-3 py-3 text-[11px] font-semibold leading-snug transition ${
                      envPoints.includes(point)
                        ? "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-sm"
                        : "border-zinc-200 bg-white text-foreground shadow-sm ring-1 ring-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                3. おすすめの利用シーン（最大3つ）
              </p>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {sceneOptions.map((scene) => (
                  <button
                    key={scene}
                    type="button"
                    onClick={() => toggleScene(scene)}
                    className={`rounded-xl border-2 px-3 py-3 text-[11px] font-semibold leading-snug transition ${
                      scenes.includes(scene)
                        ? "border-[color:var(--joyfit-red)] bg-[color:var(--joyfit-red)] text-white shadow-sm"
                        : "border-zinc-200 bg-white text-foreground shadow-sm ring-1 ring-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    {scene}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">選択中: {scenes.length} / 3</p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                その他、気に入っている点など（任意）
              </p>
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="あればご記入ください（未入力でも進められます）"
                rows={4}
                className={areaClass}
              />
            </div>

            <Button
              onClick={buildDraft}
              disabled={!profileComplete || submitting}
              className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] focus-visible:ring-2 focus-visible:ring-zinc-400/40"
            >
              口コミ用に文章を作成する
            </Button>
            {!profileComplete && (
              <p className="text-xs text-muted-foreground">※ 先に会員情報の必須項目を入力してください。</p>
            )}
          </div>
        )}

        {isLowSelected && (
          <div className="space-y-4 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 md:p-5">
            <p className="text-sm font-medium text-foreground">
              サービス向上のため、店舗スタッフへ直接お問い合わせください。
            </p>
            <div className="rounded-xl border border-amber-300/80 bg-white px-3 py-2 text-sm text-zinc-800">
              現在の選択評価: <span className="font-bold text-[color:var(--joyfit-red)]">星{rating}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              下記ボタンから、店舗宛のGmailへお問い合わせが可能です。
            </p>
            {submitError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {submitError}
              </p>
            )}
            <Button
              onClick={() => void handleLowRatingSubmit("mailto")}
              disabled={!profileComplete || submitting}
              className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white hover:bg-[color:var(--joyfit-red-dark)] focus-visible:ring-2 focus-visible:ring-zinc-400/40"
            >
              <Mail className="h-4 w-4" />
              {submitting ? "保存中…" : "メールアプリで問い合わせる"}
            </Button>
            <Button
              onClick={() => void handleLowRatingSubmit("gmailWeb")}
              disabled={!profileComplete || submitting}
              variant="outline"
              className="h-11 w-full rounded-xl border-zinc-300 text-sm font-semibold"
            >
              Gmail Webで問い合わせる（PC向け）
            </Button>
            <Button
              onClick={() => void copyLowRatingContactDraft()}
              disabled={!profileComplete || submitting}
              variant="ghost"
              className="h-10 w-full rounded-xl text-xs font-semibold text-zinc-700"
            >
              宛先・件名・本文をコピー
            </Button>
            {contactCopied && (
              <p className="text-center text-xs font-medium text-[color:var(--joyfit-red)]">
                宛先・件名・本文をコピーしました。
              </p>
            )}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              ※先に回答を保存したうえで、メール作成画面を開きます。
            </p>
          </div>
        )}

        {draft && isHigh && (
          <div className="space-y-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm md:p-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <p className="text-sm font-semibold text-zinc-900">Google 口コミ投稿のイメージ</p>
              <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-zinc-500">レビューを作成</p>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    Google 形式
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {stars.map((value) => (
                    <Star
                      key={`preview-${value}`}
                      className={`h-5 w-5 ${value <= (rating ?? 0) ? "fill-[color:var(--joyfit-red)] text-[color:var(--joyfit-red)]" : "text-zinc-300"}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs font-semibold text-zinc-700">
                  {rating === 5
                    ? "星5の高評価ありがとうございます。"
                    : rating === 4
                      ? "星4の高評価ありがとうございます。"
                      : `星${rating}の高評価ありがとうございます。`}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  投稿時は同じ評価（星{rating}）を選択してください。
                </p>
                <p className="mt-3 text-xs text-zinc-500">口コミ本文（ここで編集できます）</p>
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={6}
                  className={`${areaClass} mt-1`}
                />
              </div>
            </div>

            <p className="text-[12px] leading-relaxed text-muted-foreground">
              こちらと同じ評価・文面を貼り付けて投稿いただくことで、エンジョイポイント付与対象になります。
            </p>

            {submitError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {submitError}
              </p>
            )}
            <Button
              onClick={() => void copyDraftAndOpen()}
              disabled={submitting}
              className="h-12 w-full rounded-xl border-0 bg-[#1a73e8] text-base font-semibold text-white hover:bg-[#1765cc] focus-visible:ring-2 focus-visible:ring-blue-300/60"
            >
              <Copy className="h-4 w-4" />
              {submitting ? "保存してコピー中…" : "コピーしてGoogle口コミを開く"}
            </Button>
            {copied && (
              <p className="text-center text-xs font-medium text-blue-700">
                文面をコピーしました。同じ評価と文面を貼り付けて投稿すると特典付与対象になります。
              </p>
            )}
          </div>
        )}

        {isHigh && (
          <Button
            asChild
            variant="ghost"
            className="h-10 w-full rounded-xl text-muted-foreground hover:text-primary"
          >
            <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Googleレビュー画面を別タブで開く
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
