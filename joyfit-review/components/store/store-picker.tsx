"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search, Store } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { StoreMasterRow } from "@/lib/store-master";

type Props = {
  stores: StoreMasterRow[];
};

function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().trim();
}

function storeSubtitle(store: StoreMasterRow) {
  if (/^row\d+$/i.test(store.id)) {
    return "タップして口コミ文の作成へ";
  }
  return `店舗ID: ${store.id}`;
}

export function StorePicker({ stores }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return stores;

    return stores.filter((store) => {
      const haystack = normalize(`${store.name} ${store.searchText}`);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [query, stores]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-xl ring-1 ring-black/5">
        <div className="joyfit-brand-header px-5 pb-6 pt-8 text-center text-primary-foreground">
          <Link
            href="/"
            className="mb-4 inline-block text-xs font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
          >
            ← トップに戻る
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80">JOYFIT</p>
          <h1 className="mt-2 text-lg font-bold leading-snug md:text-xl">
            口コミを投稿する店舗を
            <br />
            選択してください
          </h1>
          <p className="mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-white/88">
            店舗名・エリア・読み（例: 経堂 / kyodo）で検索できます
          </p>
        </div>

        <div className="border-t border-primary/10 bg-card px-5 py-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="店舗名を検索"
              className="h-12 rounded-xl border-primary/20 bg-secondary/40 pl-10 text-base shadow-inner focus-visible:border-primary/40"
            />
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-primary/25 bg-card/80 px-5 py-10 text-center text-sm text-muted-foreground">
            該当する店舗がありません。
            <br />
            別のキーワードでお試しください。
          </li>
        ) : (
          filtered.map((store) => (
            <li key={store.id}>
              <Link
                href={`/member/${store.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-primary/10 bg-card p-4 shadow-md ring-1 ring-black/5 transition hover:border-primary/35 hover:shadow-lg"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition group-hover:bg-primary/18">
                  <Store className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-base font-bold text-foreground">{store.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{storeSubtitle(store)}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-primary/50 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
