import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <main className="w-full max-w-xl rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">JOYFIT 口コミサポート</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          店舗選択から、口コミ投稿導線までを運用するサンプルです。
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/select-store">
              店舗を選んで開始する
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
