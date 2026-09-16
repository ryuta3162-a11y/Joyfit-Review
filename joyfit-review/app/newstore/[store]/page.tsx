import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TodaClosingSurvey } from "@/components/newstore/toda-closing-survey";
import { MemberPageShell } from "@/components/joyfit/member-page-shell";
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
    description: `${store.name}の見学・体験後アンケートです。`,
  };
}

export default async function ClosingStorePage({ params }: Props) {
  const { store: raw } = await params;
  const slug = parseClosingStoreSlug(raw);
  if (!slug) notFound();

  return (
    <MemberPageShell>
      <TodaClosingSurvey store={CLOSING_STORES[slug]} />
    </MemberPageShell>
  );
}
