import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { PrintButton } from "@/components/newstore/print-button";
import { parseClosingStoreSlug } from "@/lib/newstore/toda-closing";

const SURVEY_URL = "https://joyfit-review.vercel.app/newstore/kyodo";

type Props = {
  params: Promise<{ store: string }>;
};

export async function generateStaticParams() {
  return [{ store: "kyodo" }];
}

export const metadata: Metadata = {
  title: "店頭ポップ | JOYFIT24経堂",
  description: "見学体験後アンケートのQRポップです",
};

export default async function KyodoStorePopPage({ params }: Props) {
  const { store: raw } = await params;
  if (parseClosingStoreSlug(raw) !== "kyodo") notFound();

  const surveyQr = await QRCode.toString(SURVEY_URL, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#171717", light: "#ffffff" },
  });

  return (
    <div className="min-h-screen bg-[#a5354b] px-4 py-8 print:min-h-0 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 print:max-w-none print:gap-0">
        <div className="print:hidden text-center text-white">
          <p className="text-[13px] font-medium text-white/80">JOYFIT24経堂</p>
          <h1 className="mt-1 text-[1.4rem] font-bold tracking-tight">
            店頭QRポップ
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-white/85">
            アンケート1枚です。正方形、またはA6で印刷してください。
          </p>
        </div>

        <div className="kyodo-pop w-full max-w-[148mm] overflow-hidden rounded-[1.6rem] bg-[#a5354b] p-4 print:max-w-none print:rounded-none print:p-6">
          <div className="flex aspect-square flex-col items-center justify-between rounded-[1.15rem] bg-white px-6 py-7 text-center shadow-[0_10px_24px_rgba(0,0,0,0.12)] print:min-h-[128mm]">
            <div>
              <p className="text-[1.45rem] font-bold leading-tight tracking-tight text-zinc-900">
                見学・体験後アンケート
              </p>
              <p className="mt-2 text-[13px] font-medium leading-relaxed text-zinc-500">
                QRコードを読み取ってください
              </p>
            </div>
            <div
              className="mx-auto aspect-square w-[72%] max-w-[14rem] [&_svg]:h-full [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: surveyQr }}
            />
            <Image
              src="/joyfit-logo-mark.png"
              alt="JOYFIT24"
              width={579}
              height={122}
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>

        <PrintButton />
      </div>
    </div>
  );
}
