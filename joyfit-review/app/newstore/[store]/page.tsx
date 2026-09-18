import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TodaClosingSurvey } from "@/components/newstore/toda-closing-survey";
import { BRAND_THEMES, brandCssVars } from "@/lib/brand";
import {
  CLOSING_STORES,
  parseClosingStoreSlug,
} from "@/lib/newstore/toda-closing";

type Props = {
  params: Promise<{ store: string }>;
};

export async function generateStaticParams() {
  return Object.keys(CLOSING_STORES).map((store) => ({ store }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store: raw } = await params;
  const slug = parseClosingStoreSlug(raw);
  if (!slug) return { title: "見学体験後アンケート" };
  const store = CLOSING_STORES[slug];
  return {
    title: `見学体験後アンケート | ${store.name}`,
    description: `${store.name}の見学・体験後アンケートです`,
  };
}

export default async function ClosingStorePage({ params }: Props) {
  const { store: raw } = await params;
  const slug = parseClosingStoreSlug(raw);
  if (!slug) notFound();

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
        <TodaClosingSurvey store={store} />
      </div>
    </div>
  );
}
