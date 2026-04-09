"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Star } from "lucide-react";

import { submitLowRatingFeedback } from "@/app/actions/submit-low-rating";
import { Button } from "@/components/ui/button";
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
const pointOptions = ["最新設備", "清潔感", "スタッフ", "通いやすさ"] as const;
const toneOptions = ["フォーマル", "カジュアル", "キュート"] as const;
const volumeOptions = ["短め", "普通", "長め"] as const;

const pointPhrases: Record<(typeof pointOptions)[number], string> = {
  最新設備: "設備が充実していて、トレーニングのモチベーションが上がります。",
  清潔感: "館内が清潔で、いつも気持ちよく利用できます。",
  スタッフ: "スタッフの対応が丁寧で、安心して通える雰囲気です。",
  通いやすさ: "立地がよく、仕事帰りやスキマ時間にも通いやすいです。",
};

export function ReviewFlow({ storeId, storeName, reviewUrl, feedbackEmail }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [points, setPoints] = useState<string[]>([]);
  const [tone, setTone] = useState<(typeof toneOptions)[number]>("カジュアル");
  const [volume, setVolume] = useState<(typeof volumeOptions)[number]>("普通");
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

  function togglePoint(point: string) {
    setPoints((current) =>
      current.includes(point) ? current.filter((item) => item !== point) : [...current, point],
    );
  }

  function buildDraft() {
    if (!rating) return;

    const pointLines = points
      .map((p) => pointPhrases[p as keyof typeof pointPhrases])
      .filter(Boolean);

    const intro =
      tone === "フォーマル"
        ? `${storeName}を利用しました。`
        : tone === "カジュアル"
          ? `${storeName}に通っています！`
          : `${storeName}、すごく良かったです♪`;

    const ratingLine = `星${rating}の評価です。`;

    const bridge =
      volume === "短め"
        ? ""
        : tone === "フォーマル"
          ? "特に良かった点は次のとおりです。"
          : tone === "カジュアル"
            ? "良かったポイントはこんな感じです。"
            : "特におすすめしたいのは…";

    const filler =
      pointLines.length === 0
        ? tone === "フォーマル"
          ? "設備と雰囲気のバランスが良く、継続して通いやすいと感じました。"
          : tone === "カジュアル"
            ? "雰囲気も使い勝手も良くて、続けられそうです。"
            : "雰囲気もスタッフも◎で、また行きたくなりました！"
        : "";

    const closing =
      tone === "フォーマル"
        ? "今後も継続して利用したいです。"
        : tone === "カジュアル"
          ? "これからも利用していきたいです。"
          : "これからも通いたいです！";

    let body = "";

    if (volume === "短め") {
      const core = pointLines[0] ?? filler;
      body = [intro, ratingLine, core, closing].filter(Boolean).join("");
    } else if (volume === "普通") {
      const mid = pointLines.length ? pointLines.join("") : filler;
      const extra = feedback.trim();
      body = [intro, ratingLine, mid, extra, closing].filter(Boolean).join("\n");
    } else {
      const midParts: string[] = [];
      if (bridge) midParts.push(bridge);
      midParts.push(...pointLines);
      if (volume === "長め" && pointLines.length >= 2) {
        midParts.push(
          tone === "フォーマル"
            ? "総じて、通いやすく安心してトレーニングに集中できる環境だと感じています。"
            : tone === "カジュアル"
              ? "総じて通いやすくて、トレーニングに集中できるのが嬉しいです。"
              : "総じて通いやすくて、また行きたくなるお店でした！",
        );
      } else if (pointLines.length === 0) {
        midParts.push(filler);
      }
      const extra = feedback.trim();
      body = [intro, ratingLine, ...midParts, extra, closing].filter(Boolean).join("\n");
    }

    setDraft(body);
    setCopied(false);
  }

  async function copyDraftAndOpen() {
    if (!draft) return;
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
    const result = await submitLowRatingFeedback({
      storeId,
      storeName,
      rating,
      message: feedback.trim(),
      storeFeedbackEmail: feedbackEmail,
    });
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
    <div className="overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-xl ring-1 ring-black/5">
      <div className="joyfit-brand-header px-5 pb-6 pt-6 text-center text-primary-foreground md:px-6 md:pt-8">
        <Link
          href="/select-store"
          className="mb-3 inline-block text-xs font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          ← 店舗選択に戻る
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80">JOYFIT</p>
        <h1 className="mt-2 text-xl font-bold md:text-2xl">{storeName}</h1>
        <p className="mt-2 text-sm text-white/90">本日のトレーニングのご感想をお聞かせください</p>
        <p className="mt-3 rounded-full border border-amber-300/35 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-50">
          特典：{ENJOY_POINT_REWARD_LABEL}
        </p>
      </div>

      <div className="space-y-6 border-t border-primary/10 p-5 md:p-6">
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
                  className={`h-9 w-9 sm:h-10 sm:w-10 ${value <= (rating ?? 0) ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-muted-foreground/35"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {canBuildGoogleDraft && (
          <div className="space-y-4 rounded-2xl border border-primary/12 bg-[var(--joyfit-green-soft)]/60 p-4 md:p-5">
            <p className="text-sm font-semibold text-foreground">よかった点（複数選択可）</p>
            <div className="grid grid-cols-2 gap-2">
              {pointOptions.map((point) => (
                <button
                  key={point}
                  type="button"
                  onClick={() => togglePoint(point)}
                  className={`rounded-xl border-2 px-3 py-3 text-xs font-semibold transition ${
                    points.includes(point)
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-transparent bg-card text-foreground shadow-sm ring-1 ring-primary/10 hover:border-primary/25"
                  }`}
                >
                  {point}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">文章のトーン</p>
                <select
                  value={tone}
                  onChange={(event) => setTone(event.target.value as (typeof toneOptions)[number])}
                  className="h-11 w-full rounded-xl border border-primary/15 bg-card px-3 text-sm shadow-sm"
                >
                  {toneOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">文章のボリューム</p>
                <select
                  value={volume}
                  onChange={(event) =>
                    setVolume(event.target.value as (typeof volumeOptions)[number])
                  }
                  className="h-11 w-full rounded-xl border border-primary/15 bg-card px-3 text-sm shadow-sm"
                >
                  {volumeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
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

            <Button onClick={buildDraft} className="h-12 w-full rounded-xl text-base font-semibold shadow-md">
              文章を作成する
            </Button>
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
              disabled={!feedback.trim() || submitting}
              className="h-12 w-full rounded-xl text-base font-semibold shadow-md"
            >
              {submitting ? "送信中…" : "担当者へメールで送信する"}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              ※店舗・管理者へメールで共有します（Googleマップの口コミとは別です）。通知先はスプレッドシートのC列、またはシステムの既定メールです。
            </p>
          </div>
        )}

        {draft && isHigh && (
          <div className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 md:p-5">
            <p className="text-sm font-semibold text-foreground">生成された口コミ文</p>
            <p className="whitespace-pre-wrap rounded-xl border border-primary/10 bg-card p-4 text-sm leading-relaxed text-foreground shadow-inner">
              {draft}
            </p>
            <p className="text-xs text-muted-foreground">
              ボタンで文章をコピーしたうえで、Googleマップの口コミ欄に貼り付けてください。
            </p>
            <Button onClick={copyDraftAndOpen} className="h-12 w-full rounded-xl text-base font-semibold shadow-md">
              <Copy className="h-4 w-4" />
              文章をコピーしてGoogleマップを開く
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
