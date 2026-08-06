import { notFound } from "next/navigation";

import { PilatesTrialEventSurvey } from "@/components/event/pilates-trial-event-survey";
import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { detectBrandFromStore } from "@/lib/brand";
import { PILATES_TRIAL_EVENT } from "@/lib/event-pilates-trial-202609";
import { fetchStoresRemote, getStoreByIdRemote } from "@/lib/stores-remote";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function YogaEventSurveyPage({ params }: Props) {
  const { slug } = await params;
  if (slug !== PILATES_TRIAL_EVENT.slug) notFound();

  let store = await getStoreByIdRemote(PILATES_TRIAL_EVENT.reviewStoreId);
  if (!store) {
    const stores = await fetchStoresRemote();
    store =
      stores.find((s) => s.id.trim().toLowerCase() === PILATES_TRIAL_EVENT.reviewStoreId) ||
      stores.find((s) => detectBrandFromStore(s.name) === "yoga");
  }

  const reviewUrl = store?.googleReviewUrl?.trim() || "";
  const storeDisplayName = store?.name?.trim() || "YOGAひばりが丘";

  return (
    <MemberPageShell>
      <PilatesTrialEventSurvey reviewUrl={reviewUrl} storeDisplayName={storeDisplayName} />
    </MemberPageShell>
  );
}
