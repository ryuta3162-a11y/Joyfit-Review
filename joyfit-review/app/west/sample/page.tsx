import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { ReviewFlow } from "@/components/member/review-flow";
import { getStoreRewardDisplay } from "@/lib/store-reward";
import { resolveGoogleWriteReviewUrl } from "@/lib/google-review-url";
import { getStoreByIdRemote } from "@/lib/stores-remote";
import {
  WEST_SAMPLE_STORE,
  WEST_SAMPLE_STORE_ID,
} from "@/lib/west-sample-store";

export const dynamic = "force-dynamic";

export default async function WestSampleStorePage() {
  const remote = await getStoreByIdRemote(WEST_SAMPLE_STORE_ID, "west");
  const store = remote
    ? {
        ...remote,
        googleReviewUrl: remote.googleReviewUrl.trim() || WEST_SAMPLE_STORE.googleReviewUrl,
      }
    : WEST_SAMPLE_STORE;

  const reward = getStoreRewardDisplay({
    storeId: store.id,
    storeName: store.name,
    rewardLabelFromSheet: store.rewardLabel,
  });

  return (
    <MemberPageShell>
      <p className="mx-auto mb-3 max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[13px] leading-relaxed text-amber-950">
        WESTテスト用ページです。店頭QR・店舗一覧には出ません。送信すると WEST のスプレッドシートに回答が残ります。
      </p>
      <ReviewFlow
        storeId={store.id}
        storeName={store.name}
        reviewUrl={await resolveGoogleWriteReviewUrl(store.googleReviewUrl)}
        feedbackEmail={store.feedbackEmail}
        reward={reward}
        region="west"
      />
    </MemberPageShell>
  );
}
