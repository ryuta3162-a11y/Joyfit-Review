"use server";

import { storesGasPingUrl } from "@/lib/gas-webapp";

const DEFAULT_CLOSING_GAS_URL =
  "https://script.google.com/macros/s/AKfycbyjyfr1fCvYQjvuFhLbkINwo7KUk8MhNwYALvXjecJ-zM5J1z4TfHJ0YnLHAQcmB-ZS6A/exec";

export async function warmupClosingSurveyGas(): Promise<void> {
  const gasUrl =
    process.env.TODA_CLOSING_GAS_URL?.trim() || DEFAULT_CLOSING_GAS_URL;
  if (!gasUrl) return;
  try {
    await fetch(storesGasPingUrl(gasUrl), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    /* ignore */
  }
}
