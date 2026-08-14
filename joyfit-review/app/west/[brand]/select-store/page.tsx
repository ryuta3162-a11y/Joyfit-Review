import { notFound } from "next/navigation";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { StorePicker } from "@/components/store/store-picker";
import { detectBrandFromStore, parseBrandParam } from "@/lib/brand";
import { fetchStoresRemote } from "@/lib/stores-remote";

type Props = {
  params: Promise<{ brand: string }>;
};

const REGION = "west" as const;
const BASE = "/west";

export default async function WestBrandSelectStorePage({ params }: Props) {
  const { brand: raw } = await params;
  const brand = parseBrandParam(raw);
  if (!brand || brand === "yoga") notFound();

  const stores = await fetchStoresRemote(REGION);
  const filtered = stores.filter((store) => detectBrandFromStore(store.name) === brand);

  return (
    <MemberPageShell>
      <StorePicker stores={filtered} brand={brand} basePath={BASE} />
    </MemberPageShell>
  );
}
