"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  storeName: string;
  reviewUrl: string;
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

export function ReviewFlow({ storeName, reviewUrl }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [points, setPoints] = useState<string[]>([]);
  const [tone, setTone] = useState<(typeof toneOptions)[number]>("フォーマル");
  const [volume, setVolume] = useState<(typeof volumeOptions)[number]>("普通");
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const isHigh = useMemo(() => (rating ?? 0) >= 4, [rating]);
  const canGenerate = (rating ?? 0) >= 1;

  function togglePoint(point: string) {
    setPoints((current) =>
      current.includes(point) ? current.filter((item) => item !== point) : [...current, point],
    );
  }

  function buildDraft() {
    if (!rating) return;
    const selectedText = points
      .map((point) => pointPhrases[point as keyof typeof pointPhrases] ?? "")
      .filter(Boolean)
      .join(" ");
    const userComment = feedback.trim();

    const intro =
      tone === "フォーマル"
        ? `${storeName}を利用しました。`
        : tone === "カジュアル"
          ? `${storeName}に行ってきました！`
          : `${storeName}、とても良かったです！`;

    const closing =
      tone === "フォーマル"
        ? "今後も継続して利用したいです。"
        : tone === "カジュアル"
          ? "これからも利用したいと思います。"
          : "またぜひ通いたいです！";

    const body = [intro, `星${rating}評価です。`, selectedText, userComment, closing]
      .filter(Boolean)
      .join("\n");

    const limit = volume === "短め" ? 100 : volume === "普通" ? 200 : 300;
    setDraft(body.slice(0, limit));
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

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ご協力ありがとうございました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>貴重なご意見を受け取りました。今後の店舗改善に活用します。</p>
          <Button asChild variant="outline">
            <Link href="/select-store">別の店舗を選択する</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{storeName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium">本日のトレーニングはいかがでしたか？</p>
          <div className="flex gap-2">
            {stars.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-md p-1 transition hover:bg-accent"
                aria-label={`${value} stars`}
              >
                <Star
                  className={`h-8 w-8 ${value <= (rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {canGenerate && (
          <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">よかった点（複数選択可）</p>
            <div className="grid grid-cols-2 gap-2">
              {pointOptions.map((point) => (
                <button
                  key={point}
                  type="button"
                  onClick={() => togglePoint(point)}
                  className={`rounded-md border px-3 py-2 text-xs ${points.includes(point) ? "border-primary bg-primary/10 text-primary" : "bg-background"}`}
                >
                  {point}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium">文章のトーン</p>
                <select
                  value={tone}
                  onChange={(event) => setTone(event.target.value as (typeof toneOptions)[number])}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                >
                  {toneOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium">文章のボリューム</p>
                <select
                  value={volume}
                  onChange={(event) =>
                    setVolume(event.target.value as (typeof volumeOptions)[number])
                  }
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
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
              <p className="mb-1 text-xs font-medium">自由な感想（任意）</p>
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="自由な感想をご記入ください"
                rows={4}
              />
            </div>

            <Button onClick={buildDraft} className="w-full">
              文章を作成する
            </Button>
          </div>
        )}

        {draft && isHigh && (
          <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">生成された口コミ文</p>
            <p className="whitespace-pre-wrap rounded-md border bg-background p-3 text-sm">{draft}</p>
            <Button onClick={copyDraftAndOpen} className="w-full">
              <Copy className="h-4 w-4" />
              文章をコピーしてGoogleマップを開く
            </Button>
            {copied && <p className="text-xs text-muted-foreground">コピーしました。</p>}
          </div>
        )}

        {draft && !isHigh && (
          <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm">ご意見ありがとうございます。店舗改善に活用します。</p>
            <Button onClick={() => setSent(true)} className="w-full" variant="outline">
              送信して完了
            </Button>
          </div>
        )}

        <Button asChild variant="ghost" className="w-full">
          <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            GoogleレビューURLを直接開く
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
