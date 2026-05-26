import { notFound } from "next/navigation";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { StorePicker } from "@/components/store/store-picker";
import { detectBrand, parseBrandParam } from "@/lib/brand";
import { fetchStoresRemote } from "@/lib/stores-remote";

type Props = {
  params: Promise<{ brand: string }>;
};

export default async function BrandSelectStorePage({ params }: Props) {
  const { brand: raw } = await params;
  const brand = parseBrandParam(raw);
  if (!brand) notFound();

  const stores = await fetchStoresRemote();
  const filtered = stores.filter((store) => detectBrand(store.name) === brand);

  return (
    <MemberPageShell>
      <StorePicker stores={filtered} brand={brand} />
    </MemberPageShell>
  );
}
