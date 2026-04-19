"use client";

import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Star } from "lucide-react";

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
  /** スプレッドシートC列。空のときは DEFAULT_LOW_RATING_EMAIL を使用 */
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
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isHigh = useMemo(() => (rating ?? 0) >= 4, [rating]);
  const canBuildGoogleDraft = (rating ?? 0) >= 4;
  const isLowSelected = rating !== null && !isHigh;

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
  const memberCodeOk = useMemo(() => {
    const mc = memberCode.trim();
    return !mc || /^\d{10}$/.test(mc);
  }, [memberCode]);
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
      visitDate,
      positives: allPositives,
      useScenes: scenes,
      freeComment: feedback,
      generatedReview: payloadReview,
      storeFeedbackEmail: feedbackEmail,
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

  async function handleLowRatingSubmit() {
    if (!rating || rating >= 4 || !feedback.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitSurvey("");
    setSubmitting(false);
    if (result.ok) {
      setSent(true);
    } else {
      setSubmitError(result.error);
    }
  }

  if (sent) {
    return (
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-xl ring-1 ring-black/5">
        <div className="joyfit-brand-header px-6 py-10 text-center text-primary-foreground">
          <p className="text-4xl">🙏</p>
          <h2 className="mt-4 text-xl font-bold">ご協力ありがとうございました</h2>
          <p className="mx-auto mt-3 max-w-xs text-sm text-white/90">
            いただいたご意見を担当者へ送信しました。店舗改善の参考にさせていただきます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-card text-foreground shadow-2xl ring-1 ring-black/20">
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

      <div className="space-y-6 border-t border-zinc-200/80 bg-gradient-to-b from-zinc-50/90 to-white p-5 md:p-6">
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          aria-label="入力の流れ"
        >
          {["会員情報", "満足度", "コメント", "送信"].map((label, i) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-200 bg-white px-2 py-2 text-center text-[10px] font-bold text-zinc-600 shadow-sm"
            >
              <span className="block text-[9px] font-extrabold tracking-wide text-[color:var(--joyfit-red)]">
                STEP {i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">会員情報の入力</p>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">名前（フルネーム）*</p>
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">会員番号（任意・10桁）</p>
            <Input
              value={memberCode}
              inputMode="numeric"
              maxLength={10}
              placeholder="1234567890"
              onChange={(event) =>
                setMemberCode(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              JOYFIT APP 右上「サービス」→「契約情報」から確認できます。
            </p>
            {!memberCodeOk && (
              <p className="mt-1 text-[11px] font-medium text-[color:var(--joyfit-red)]">
                会員番号は空欄か、10桁の数字で入力してください。
              </p>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">性別*</p>
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
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">年齢*</p>
              <select
                value={ageRange}
                onChange={(event) => setAgeRange(event.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm"
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
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">メールアドレス*</p>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sample@example.com"
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">ご利用日*</p>
            <Input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} />
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">満足度（星をタップ）</p>
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
                  className={`h-9 w-9 sm:h-10 sm:w-10 ${value <= (rating ?? 0) ? "fill-[color:var(--joyfit-red)] text-[color:var(--joyfit-red)] drop-shadow-sm" : "text-zinc-300"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {canBuildGoogleDraft && (
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/90 p-4 shadow-sm md:p-5">
            <p className="text-sm font-semibold text-foreground">よかった点を教えてください（複数選択可）</p>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                1. メニュー・サービスで良かった点
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {menuServiceOptions.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => toggleList(point, setMenuPoints)}
                    className={`rounded-xl border-2 px-3 py-3 text-xs font-semibold transition ${
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {environmentOptions.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => toggleList(point, setEnvPoints)}
                    className={`rounded-xl border-2 px-3 py-3 text-xs font-semibold transition ${
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sceneOptions.map((scene) => (
                  <button
                    key={scene}
                    type="button"
                    onClick={() => toggleScene(scene)}
                    className={`rounded-xl border-2 px-3 py-3 text-xs font-semibold transition ${
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
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">自由な感想（任意）</p>
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="マシンやスタッフの対応など、自由にご記入ください"
                rows={4}
                className="rounded-xl border-primary/15 bg-card"
              />
            </div>

            <Button
              onClick={buildDraft}
              disabled={!profileComplete || submitting}
              className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white shadow-md hover:bg-[color:var(--joyfit-red-dark)]"
            >
              文章を自動作成する
            </Button>
            {!profileComplete && (
              <p className="text-xs text-muted-foreground">※ 先に会員情報の必須項目を入力してください。</p>
            )}
          </div>
        )}

        {isLowSelected && (
          <div className="space-y-4 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 md:p-5">
            <p className="text-sm font-medium text-foreground">
              ご不便をおかけしております。改善のため、お気づきの点をお聞かせください。
            </p>
            <Textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="気になった点やご要望をご記入ください（店内対応の参考にします）"
              rows={5}
              className="rounded-xl border-amber-200/80 bg-card"
            />
            {submitError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {submitError}
              </p>
            )}
            <Button
              onClick={() => void handleLowRatingSubmit()}
              disabled={!feedback.trim() || !profileComplete || submitting}
              className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white shadow-md hover:bg-[color:var(--joyfit-red-dark)]"
            >
              {submitting ? "送信中…" : "担当者へ送信する"}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              ※入力内容は店舗別シートへ保存され、低評価時は担当者へメール通知されます。
            </p>
          </div>
        )}

        {draft && isHigh && (
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-5">
            <p className="text-sm font-semibold text-foreground">生成された口コミ文</p>
            <p className="whitespace-pre-wrap rounded-xl border border-primary/10 bg-card p-4 text-sm leading-relaxed text-foreground shadow-inner">
              {draft}
            </p>
            <p className="text-xs text-muted-foreground">
              ボタンで文章をコピーしたうえで、Googleマップの口コミ欄に貼り付けてください。
            </p>
            {submitError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {submitError}
              </p>
            )}
            <Button
              onClick={copyDraftAndOpen}
              disabled={submitting}
              className="h-12 w-full rounded-xl border-0 bg-[color:var(--joyfit-red)] text-base font-semibold text-white shadow-md hover:bg-[color:var(--joyfit-red-dark)]"
            >
              <Copy className="h-4 w-4" />
              {submitting ? "保存中…" : "文章をコピーしてGoogleマップを開く"}
            </Button>
            {copied && <p className="text-center text-xs font-medium text-primary">コピーしました</p>}
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
