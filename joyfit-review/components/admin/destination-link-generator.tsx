"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Destination = {
  id: string;
  label: string;
  baseUrl: string;
  description: string;
};

const destinations: Destination[] = [
  {
    id: "google-review",
    label: "Googleレビュー誘導URL",
    baseUrl: "https://example.joyfit-review.com/landing",
    description: "会員向けの口コミ獲得ページに遷移",
  },
  {
    id: "feedback-sheet",
    label: "改善要望スプレッドシート出力",
    baseUrl: "https://docs.google.com/spreadsheets/d/feedback-sheet-id",
    description: "低評価時の内部フィードバック集計",
  },
  {
    id: "store-dashboard",
    label: "店舗別管理ダッシュボード",
    baseUrl: "https://example.joyfit-review.com/dashboard",
    description: "店舗運用担当向けの管理画面",
  },
];

export function DestinationLinkGenerator() {
  const [selectedId, setSelectedId] = useState(destinations[0].id);
  const [storeKey, setStoreKey] = useState("r-kusaka@okamoto-group.co.jp");

  const selectedDestination = useMemo(
    () => destinations.find((item) => item.id === selectedId) ?? destinations[0],
    [selectedId],
  );

  const generatedUrl = useMemo(() => {
    const url = new URL(selectedDestination.baseUrl);
    url.searchParams.set("key", storeKey);
    return url.toString();
  }, [selectedDestination.baseUrl, storeKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>出力先URLジェネレーター</CardTitle>
        <CardDescription>
          出力先を選び、店舗名またはメールを入力すると遷移先URLを自動生成します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-1">
            <p className="text-xs text-muted-foreground">出力先</p>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {destinations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <p className="text-xs text-muted-foreground">店舗キー（テスト: メールアドレス）</p>
            <Input
              value={storeKey}
              onChange={(event) => setStoreKey(event.target.value)}
              placeholder="例: JOYFIT渋谷店 または メールアドレス"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-1 text-xs text-muted-foreground">{selectedDestination.description}</p>
          <div className="flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate font-medium">{generatedUrl}</p>
          </div>
        </div>

        <Button asChild>
          <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
            生成URLを開く
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
