import type { CSSProperties } from "react";

export type Brand = "joyfit" | "fit365" | "yoga";

const YOGA_STORE_NAME_ALIASES = [
  "joyfit yoga フレスポひばりが丘",
  "yogaひばりが丘",
] as const;

function normalizeStoreName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

/** YOGA専用店舗か（現状1店舗） */
export function isYogaStore(storeName: string): boolean {
  const normalized = normalizeStoreName(storeName);
  return YOGA_STORE_NAME_ALIASES.some((name) => normalizeStoreName(name) === normalized);
}

/**
 * 店舗名からブランドを判定する。
 * FIT365 → yoga店舗 → それ以外は joyfit
 */
export function detectBrandFromStore(storeName: string): Brand {
  if (/^\s*fit365/i.test(storeName)) return "fit365";
  if (isYogaStore(storeName)) return "yoga";
  return "joyfit";
}

/** @deprecated detectBrandFromStore と同義。既存呼び出し互換用 */
export function detectBrand(storeName: string): Brand {
  return detectBrandFromStore(storeName);
}

export type BrandTheme = {
  brand: Brand;
  /** ヘッダー帯やボタンに使う基調色 */
  primary: string;
  /** ホバー・濃色用 */
  primaryDark: string;
  /** ヘッダー背景の補色（グラデーション用） */
  primarySoft: string;
  /** ブランド表示名 */
  label: string;
  /** ブランドのフルネーム（タイトル等） */
  fullLabel: string;
  /** 特典で付与されるポイント名 */
  rewardPointName: string;
  /** バッジに表示する特典文言 */
  rewardLabel: string;
  /** ポイント制度の説明ページ（任意） */
  rewardPointLearnMoreUrl?: string;
  rewardPointLearnMoreLabel?: string;
  /** 店舗ページ上部に表示するマスコット画像（任意） */
  mascotSrc?: string;
  mascotAlt?: string;
  /** ヘッダーロゴ画像（任意） */
  logoSrc?: string;
  logoAlt?: string;
};

export const BRAND_THEMES: Record<Brand, BrandTheme> = {
  joyfit: {
    brand: "joyfit",
    primary: "#a5354b",
    primaryDark: "#862d3d",
    primarySoft: "#bf4e64",
    label: "JOYFIT24",
    fullLabel: "JOYFIT24",
    rewardPointName: "エンジョイポイント",
    rewardLabel: "アンケート回答特典：エンジョイポイント500P付与",
    rewardPointLearnMoreUrl: "https://joyfit.jp/pr_enjoypoint/",
    rewardPointLearnMoreLabel: "EnjoyPointについてはこちらから",
  },
  fit365: {
    brand: "fit365",
    primary: "#f29bb4",
    primaryDark: "#d97b9d",
    primarySoft: "#f29bb4",
    label: "FIT365",
    fullLabel: "FIT365 24時間ジム",
    rewardPointName: "ベアレージポイント",
    rewardLabel: "アンケート回答特典：ベアレージポイント500P付与",
    mascotSrc: "/fit365-bears.png",
    mascotAlt: "FIT365 公式マスコット ベアクマ",
  },
  yoga: {
    brand: "yoga",
    primary: "#0C9090",
    primaryDark: "#0A7A7A",
    primarySoft: "#25A3A3",
    label: "JOYFIT YOGA",
    fullLabel: "JOYFIT YOGA",
    rewardPointName: "エンジョイポイント",
    rewardLabel: "アンケート回答特典：エンジョイポイント500P付与",
    rewardPointLearnMoreUrl: "https://joyfit.jp/pr_enjoypoint/",
    rewardPointLearnMoreLabel: "EnjoyPointについてはこちらから",
    logoSrc: "/joyfit-yoga-logo.png",
    logoAlt: "JOY FIT YOGA",
  },
};

export function getBrandTheme(storeName: string): BrandTheme {
  return BRAND_THEMES[detectBrandFromStore(storeName)];
}

export function isBrand(value: string | undefined | null): value is Brand {
  return value === "joyfit" || value === "fit365" || value === "yoga";
}

/** URL パラメータからブランドを得る（不正値は null） */
export function parseBrandParam(value: string | undefined | null): Brand | null {
  return isBrand(value) ? value : null;
}

/** ページ全体に適用してブランドカラーを切り替えるための CSS 変数 */
export function brandCssVars(theme: BrandTheme): CSSProperties {
  return {
    ["--joyfit-red" as string]: theme.primary,
    ["--joyfit-red-dark" as string]: theme.primaryDark,
    ["--brand-soft" as string]: theme.primarySoft,
  } satisfies CSSProperties;
}

/** トップ・店舗選択など、店舗未確定のページで使う共通文言 */
export const SHARED_REWARD_BADGE_LABEL =
  "アンケート回答特典：エンジョイポイント / ベアレージポイント 500P付与";
