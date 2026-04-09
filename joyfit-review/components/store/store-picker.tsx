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
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium tracking-widest text-muted-foreground">JOYFIT</p>
        <h1 className="mt-2 text-xl font-semibold leading-snug">口コミを投稿する店舗を選択してください</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          例: 経堂 / きょうどう / キョウドウ / kyodo
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="店舗名を検索"
            className="h-11 pl-9"
          />
        </div>
      </div>

      <ul className="space-y-2">
        {filtered.map((store) => (
          <li key={store.id}>
            <Link
              href={`/member/${store.id}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition hover:bg-accent"
            >
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Store className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{store.name}</span>
                <span className="block text-xs text-muted-foreground">{store.id}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
