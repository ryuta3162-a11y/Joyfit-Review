import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { KyodoReviewFlow } from "@/components/newstore/kyodo-review-flow";
import { BRAND_THEMES, brandCssVars } from "@/lib/brand";
import {
  CLOSING_STORES,
  parseClosingStoreSlug,
} from "@/lib/newstore/toda-closing";

type Props = {
  params: Promise<{ store: string }>;
};

export async function generateStaticParams() {
  return [{ store: "kyodo" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store: raw } = await params;
  const slug = parseClosingStoreSlug(raw);
  if (slug !== "kyodo") return { title: "口コミ投稿" };
  const store = CLOSING_STORES[slug];
  return {
    title: `口コミ投稿 | ${store.name}`,
    description: `${store.name}の見学・体験後の口コミ投稿です`,
  };
}

export default async function ClosingStoreReviewPage({ params }: Props) {
  const { store: raw } = await params;
  const slug = parseClosingStoreSlug(raw);
  if (slug !== "kyodo") notFound();

  const store = CLOSING_STORES[slug];
  const theme = BRAND_THEMES[store.brand];

  return (
    <div
      data-brand={store.brand}
      className="min-h-screen px-4 pb-12 pt-7 md:px-6 md:pt-9"
      style={{
        ...brandCssVars(theme),
        background: "var(--joyfit-red)",
      }}
    >
      <div className="mx-auto w-full max-w-xl">
        <KyodoReviewFlow store={store} />
      </div>
    </div>
  );
}
