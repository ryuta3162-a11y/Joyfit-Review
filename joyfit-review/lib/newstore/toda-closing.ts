/**
 * 見学体験後アンケート（経堂 / 戸田新曽）
 * 画面URLは店舗ごと、回答は同じスプレッドシートへ保存する。
 */

import type { Brand } from "@/lib/brand";

export type ClosingStoreSlug = "kyodo" | "toda";

export type ClosingStore = {
  slug: ClosingStoreSlug;
  id: string;
  name: string;
  brand: Brand;
  /** 空なら Google 口コミ投稿フォームはまだ使わない */
  googleReviewUrl: string;
  mapsUrl: string;
  appInstallUrl: string;
  appInstallBody: string;
  appInstallLinkLabel: string;
  showJoinCampaign: boolean;
  showTrialHours: boolean;
};

export const CLOSING_STORES: Record<ClosingStoreSlug, ClosingStore> = {
  kyodo: {
    slug: "kyodo",
    id: "kyodo",
    name: "JOYFIT24経堂",
    brand: "joyfit",
    googleReviewUrl: "https://g.page/r/Cdo92khF2w03EAE/review",
    mapsUrl: "https://g.page/r/Cdo92khF2w03EAE",
    appInstallUrl: "https://procedure.joyfit.jp/qrcode2/index.html",
    appInstallBody: "JOYFITアプリよりご入会手続きが可能でございます。",
    appInstallLinkLabel: "アプリ登録はこちら",
    showJoinCampaign: false,
    showTrialHours: false,
  },
  toda: {
    slug: "toda",
    id: "todaniizo",
    name: "FIT365 戸田新曽",
    brand: "fit365",
    googleReviewUrl:
      "https://www.google.com/maps/place//data=!4m3!3m2!1s0x6018ebf70f0ce3d5:0x11aae5a2eeb77b1d!12e1?source=g.page.m.kd._&laa=lu-desktop-review-solicitation",
    mapsUrl: "https://maps.app.goo.gl/zWhH3JD89u7LyzoV9",
    appInstallUrl: "https://fit365.jp/pr_app/",
    appInstallBody: "FIT365アプリよりご入会手続きが可能でございます。",
    appInstallLinkLabel: "アプリインストールはこちら",
    showJoinCampaign: true,
    showTrialHours: true,
  },
};

export function parseClosingStoreSlug(value: string | undefined | null): ClosingStoreSlug | null {
  if (value === "kyodo" || value === "toda") return value;
  return null;
}

/** @deprecated 戸田単体時の別名。CLOSING_STORES.toda を使う */
export const TODA_STORE = CLOSING_STORES.toda;

export type TodaVisitType = "kengaku" | "taiken";

export const VISIT_TYPE_LABEL: Record<TodaVisitType, string> = {
  kengaku: "見学",
  taiken: "無料体験",
};

export const PAGE_TITLE = "見学体験後アンケート";

export const LANDING_THANKS =
  "本日はご来館いただきましてありがとうございました。";
export const LANDING_PLEASE =
  "見学か体験を選択いただき、アンケートへのご協力をお願いいたします。";

export const FORM_NOTE =
  "ご入力完了後にスタッフをお呼びください。ご不安な場合は、スタッフへお気軽にお申し付けください。";
export const PRIVACY_NOTE =
  "お預かりした個人情報は、当店にて厳重に管理いたします。";

export const TAIKEN_HOURS = "体験可能時間 10:00-19:00 ／ お一人様1回限り";

export const GENDER_OPTIONS = ["男性", "女性", "回答しない"] as const;

export const AGE_OPTIONS = [
  "10代",
  "20代",
  "30代",
  "40代",
  "50代",
  "60代",
  "70代以上",
] as const;

export const STUDENT_TOGGLE_LABEL = "学生である";

export const GYM_EXPERIENCE_OPTIONS = [
  "初めて利用する",
  "以前利用していたことがある (1年以上のブランク)",
  "現在も他のジムを利用している",
  "数ヶ月以内に他のジムを利用したことがある",
] as const;

export const HOW_FOUND_OPTIONS = [
  "WEB広告",
  "SNS (Instagram, X, TikTokなど)",
  "チラシ",
  "知人・友人の紹介",
  "現地を見て",
  "その他",
] as const;

export const RATING_QUESTION =
  "当クラブを知人友人に紹介したいと思いますか？";
export const RATING_HINT = "星5で評価してください";

export const EXTRA_COMMENT_TITLE =
  "追加で何かご意見があればご記載ください";

export const JOIN_QUESTION_TITLE = "ご入会はされますか？";
export const JOIN_QUESTION_CAMPAIGN_LINES = [
  "💡体験当日のご入会者限定💡",
  "翌々月の月会費1,000円OFF！",
  "キャンペーンと併用可！",
] as const;
export const JOIN_QUESTION_NOTE =
  "※本日入会すると回答した方に適用されます。";

export const JOIN_OPTIONS_CAMPAIGN = [
  "本日入会する（会費1,000円OFF）",
  "後日入会予定",
  "入会しない",
  "検討中",
] as const;

export const JOIN_OPTIONS_DEFAULT = [
  "本日入会する",
  "後日入会予定",
  "入会しない",
  "検討中",
] as const;

export const APP_SECTION_TITLE = "入会ご希望の方へ";

export const REVIEW_POSITIVES_TITLE =
  "見学・体験で、どこが良かったですか？";
export const REVIEW_POSITIVES_HINT =
  "当てはまるものをいくつかタップしてください。口コミ文に使います。";
export const MAX_REVIEW_POSITIVES = 4;

export const REVIEW_POSITIVE_OPTIONS = [
  "スタッフの案内が丁寧",
  "店内が清潔で新しい",
  "マシンが充実している",
  "24時間通える",
  "駐車場がある",
  "通いやすい立地",
  "初心者でも入りやすい",
  "料金が分かりやすい",
  "セキュリティが安心",
  "レディースエリアがある",
  "雰囲気が明るい",
  "説明が分かりやすい",
] as const;

export function toggleLimited(
  current: string[],
  item: string,
  max: number,
): string[] {
  if (current.includes(item)) return current.filter((v) => v !== item);
  if (current.length >= max) return current;
  return [...current, item];
}

function formatEnumPhrases(items: string[]): string {
  const list = items.filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join("、")}や${list[list.length - 1]}`;
}

export type TodaReviewDraftInput = {
  storeName: string;
  visitType: TodaVisitType;
  positives: string[];
  extraComment: string;
  rating: number;
};

export function buildTodaReviewDraft(input: TodaReviewDraftInput): string {
  const visitWord = VISIT_TYPE_LABEL[input.visitType];
  const lines: string[] = [];
  lines.push(`${input.storeName}を${visitWord}しました。`);

  if (input.positives.length) {
    lines.push(`${formatEnumPhrases(input.positives)}と感じました。`);
  }

  const comment = input.extraComment.trim();
  if (comment) lines.push(comment);

  if (input.rating >= 4) {
    lines.push(
      input.visitType === "kengaku"
        ? "見学してよかったです。"
        : "通いやすく、また利用したいと思いました。",
    );
  }

  return lines.join("\n");
}
