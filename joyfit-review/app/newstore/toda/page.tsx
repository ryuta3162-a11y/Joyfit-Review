import type { Metadata } from "next";

import { TodaClosingSurvey } from "@/components/newstore/toda-closing-survey";
import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { TODA_STORE } from "@/lib/newstore/toda-closing";

export const metadata: Metadata = {
  title: "見学・体験アンケート | FIT365 戸田新曽",
  description: "FIT365 戸田新曽の見学・無料体験アンケートです。",
};

export default function TodaClosingPage() {
  return (
    <MemberPageShell>
      <TodaClosingSurvey googleReviewUrl={TODA_STORE.googleReviewUrl} />
    </MemberPageShell>
  );
}
