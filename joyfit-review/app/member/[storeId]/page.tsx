import { redirect } from "next/navigation";

import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { ReviewFlow } from "@/components/member/review-flow";
import { fetchStoresRemote, getStoreByIdRemote } from "@/lib/stores-remote";

type Props = {
  params: Promise<{ storeId: string }>;
};

export default async function MemberStorePage({ params }: Props) {
  const { storeId } = await params;
  const normalizedId = String(storeId || "").trim();
  let store = await getStoreByIdRemote(normalizedId);

  // URLの大小文字/空白ゆれがあっても到達できるようにする
  if (!store) {
    const stores = await fetchStoresRemote();
    const lowered = normalizedId.toLowerCase();
    store = stores.find((s) => s.id.trim().toLowerCase() === lowered);
  }

  if (!store) {
    redirect("/select-store");
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
