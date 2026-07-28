import { notFound, redirect } from "next/navigation";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { StorePicker } from "@/components/store/store-picker";
import { detectBrandFromStore, parseBrandParam } from "@/lib/brand";
import { fetchStoresRemote } from "@/lib/stores-remote";

type Props = {
  params: Promise<{ brand: string }>;
};

export default async function BrandSelectStorePage({ params }: Props) {
  const { brand: raw } = await params;
  const brand = parseBrandParam(raw);
  if (!brand) notFound();

  const stores = await fetchStoresRemote();
  const filtered = stores.filter((store) => detectBrandFromStore(store.name) === brand);

  // YOGA は1店舗のみのため、店舗選択・位置情報を挟まずアンケートへ直行
  if (brand === "yoga" && filtered.length >= 1) {
    redirect(`/yoga/member/${filtered[0].id}`);
  }

  return (
    <MemberPageShell>
      <StorePicker stores={filtered} brand={brand} />
    </MemberPageShell>
  );
}
