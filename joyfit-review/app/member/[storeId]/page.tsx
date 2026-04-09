import { notFound } from "next/navigation";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { ReviewFlow } from "@/components/member/review-flow";
import { getStoreByIdRemote } from "@/lib/stores-remote";

type Props = {
  params: Promise<{ storeId: string }>;
};

export default async function MemberStorePage({ params }: Props) {
  const { storeId } = await params;
  const store = await getStoreByIdRemote(storeId);

  if (!store) {
    notFound();
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
