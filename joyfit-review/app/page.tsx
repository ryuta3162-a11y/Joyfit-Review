import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <main className="w-full max-w-xl rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">JOYFIT Review SaaS</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          JOYFIT各店舗向けに、口コミ獲得とAI返信を支援する管理システムの土台を構築しました。
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard">
              管理画面を開く
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
