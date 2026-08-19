"use server";

import { storesGasPingUrl } from "@/lib/gas-webapp";
import { getStoresGasUrl, parseReviewRegion, type ReviewRegion } from "@/lib/region";

/** 入力中に GAS を起こしておき、保存時の待ちを短くする */
export async function warmupSurveyGas(region?: ReviewRegion | string): Promise<void> {
  const gasUrl = getStoresGasUrl(parseReviewRegion(region));
  if (!gasUrl) return;
  try {
    await fetch(storesGasPingUrl(gasUrl), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    // 失敗しても保存処理に影響させない
  }
}
