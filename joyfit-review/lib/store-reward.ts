import { type Brand, BRAND_THEMES, detectBrand } from "@/lib/brand";

/** 店舗ごとに特典が異なる場合の共通注記 */
export const STORE_REWARD_VARIES_NOTE =
  "※ 特典内容は店舗によって異なる場合がございます";

export type StoreRewardDisplay = {
  rewardLabel: string;
  rewardPointLearnMoreUrl?: string;
  rewardPointLearnMoreLabel?: string;
};

/** コード上の店舗別上書き（スプレッドシート未設定時のフォールバック） */
const STORE_REWARD_OVERRIDES_BY_ID: Partial<Record<string, StoreRewardDisplay>> = {
  /** JOYFIT24新所沢（店舗IDはスプレッドシートD列に合わせる） */
  shinshintokawa: {
    rewardLabel: "アンケート回答特典：エンジョイポイント100P付与",
    rewardPointLearnMoreUrl: "https://joyfit.jp/pr_enjoypoint/",
    rewardPointLearnMoreLabel: "EnjoyPointについてはこちらから",
  },
};

function joyfitEnjoyPointExtras(): Pick<
  StoreRewardDisplay,
  "rewardPointLearnMoreUrl" | "rewardPointLearnMoreLabel"
> {
  const theme = BRAND_THEMES.joyfit;
  return {
    rewardPointLearnMoreUrl: theme.rewardPointLearnMoreUrl,
    rewardPointLearnMoreLabel: theme.rewardPointLearnMoreLabel,
  };
}

function matchRewardByStoreName(storeName: string, brand: Brand): StoreRewardDisplay | null {
  if (brand !== "joyfit") return null;
  if (!/新所沢/.test(storeName)) return null;
  return {
    rewardLabel: "アンケート回答特典：エンジョイポイント100P付与",
    ...joyfitEnjoyPointExtras(),
  };
}

/**
 * 店舗ページなど、店舗が確定した画面用の特典表示。
 * 優先順: スプレッドシートの rewardLabel → コード上書き → 店舗名 → ブランド既定
 */
export function getStoreRewardDisplay(input: {
  storeId: string;
  storeName: string;
  rewardLabelFromSheet?: string;
}): StoreRewardDisplay {
  const brand = detectBrand(input.storeName);
  const fromSheet = input.rewardLabelFromSheet?.trim();
  if (fromSheet) {
    return {
      rewardLabel: fromSheet,
      ...(brand === "joyfit" ? joyfitEnjoyPointExtras() : {}),
    };
  }

  const idKey = input.storeId.trim().toLowerCase();
  const byId = STORE_REWARD_OVERRIDES_BY_ID[idKey];
  if (byId) {
    return {
      ...joyfitEnjoyPointExtras(),
      ...byId,
      rewardLabel: byId.rewardLabel,
    };
  }

  const byName = matchRewardByStoreName(input.storeName, brand);
  if (byName) return byName;

  const theme = BRAND_THEMES[brand];
  return {
    rewardLabel: theme.rewardLabel,
    rewardPointLearnMoreUrl: theme.rewardPointLearnMoreUrl,
    rewardPointLearnMoreLabel: theme.rewardPointLearnMoreLabel,
  };
}

/** ブランドトップ（店舗未選択）用。特典はブランド既定＋注記のみ */
export function getBrandTopRewardDisplay(brand: Brand): StoreRewardDisplay {
  const theme = BRAND_THEMES[brand];
  return {
    rewardLabel: theme.rewardLabel,
    rewardPointLearnMoreUrl: theme.rewardPointLearnMoreUrl,
    rewardPointLearnMoreLabel: theme.rewardPointLearnMoreLabel,
  };
}
