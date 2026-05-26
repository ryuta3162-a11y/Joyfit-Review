import { redirect, notFound } from "next/navigation";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { ReviewFlow } from "@/components/member/review-flow";
import { detectBrand, parseBrandParam } from "@/lib/brand";
import { fetchStoresRemote, getStoreByIdRemote } from "@/lib/stores-remote";

type Props = {
  params: Promise<{ brand: string; storeId: string }>;
};

export default async function BrandMemberStorePage({ params }: Props) {
  const { brand: rawBrand, storeId } = await params;
  const brand = parseBrandParam(rawBrand);
  if (!brand) notFound();

  const normalizedId = String(storeId || "").trim();
  let store = await getStoreByIdRemote(normalizedId);

  if (!store) {
    const stores = await fetchStoresRemote();
    const lowered = normalizedId.toLowerCase();
    store = stores.find((s) => s.id.trim().toLowerCase() === lowered);
  }

  if (!store) {
    redirect(`/${brand}/select-store`);
  }

  const storeBrand = detectBrand(store.name);
  if (storeBrand !== brand) {
    redirect(`/${storeBrand}/member/${store.id}`);
  }

  return (
    <MemberPageShell>
      <ReviewFlow
        storeId={store.id}
        storeName={store.name}
        reviewUrl={store.googleReviewUrl}
        feedbackEmail={store.feedbackEmail}
      />
    </MemberPageShell>
  );
}
