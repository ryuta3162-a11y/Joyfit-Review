import { notFound, redirect } from "next/navigation";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { ReviewFlow } from "@/components/member/review-flow";
import { detectBrandFromStore, parseBrandParam } from "@/lib/brand";
import { getStoreRewardDisplay } from "@/lib/store-reward";
import { resolveGoogleWriteReviewUrl } from "@/lib/google-review-url";
import { fetchStoresRemote, getStoreByIdRemote } from "@/lib/stores-remote";
import { isWestSampleStoreId } from "@/lib/west-sample-store";

type Props = {
  params: Promise<{ brand: string; storeId: string }>;
};

const REGION = "west" as const;
const BASE = "/west";

export default async function WestBrandMemberStorePage({ params }: Props) {
  const { brand: rawBrand, storeId } = await params;
  const brand = parseBrandParam(rawBrand);
  if (!brand || brand === "yoga") notFound();

  const normalizedId = String(storeId || "").trim();
  if (isWestSampleStoreId(normalizedId)) {
    redirect("/west/sample");
  }

  let store = await getStoreByIdRemote(normalizedId, REGION);

  if (!store) {
    const stores = await fetchStoresRemote(REGION);
    const lowered = normalizedId.toLowerCase();
    store = stores.find((s) => s.id.trim().toLowerCase() === lowered);
  }

  if (!store) {
    redirect(`${BASE}/${brand}/select-store`);
  }

  const storeBrand = detectBrandFromStore(store.name);
  if (storeBrand !== brand) {
    redirect(`${BASE}/${storeBrand}/member/${store.id}`);
  }

  const reward = getStoreRewardDisplay({
    storeId: store.id,
    storeName: store.name,
    rewardLabelFromSheet: store.rewardLabel,
  });

  return (
    <MemberPageShell>
      <ReviewFlow
        storeId={store.id}
        storeName={store.name}
        reviewUrl={await resolveGoogleWriteReviewUrl(store.googleReviewUrl)}
        feedbackEmail={store.feedbackEmail}
        reward={reward}
        region={REGION}
      />
    </MemberPageShell>
  );
}
