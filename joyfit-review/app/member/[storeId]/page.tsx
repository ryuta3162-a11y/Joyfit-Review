import { notFound } from "next/navigation";

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
    <div className="min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="mx-auto max-w-xl">
        <ReviewFlow storeName={store.name} reviewUrl={store.googleReviewUrl} />
      </div>
    </div>
  );
}
