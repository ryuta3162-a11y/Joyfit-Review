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
  /** 空なら Google マップ投稿フォームはまだ使わない */
  googleReviewUrl: string;
  mapsUrl: string;
  appInstallUrl: string;
  appInstallIosUrl: string;
  appInstallAndroidUrl: string;
  appInstallBody: string;
  appInstallLinkLabel: string;
};

export const APP_INSTALL_LEAD = "入会ご希望の方は";

export const CLOSING_STORES: Record<ClosingStoreSlug, ClosingStore> = {
  kyodo: {
    slug: "kyodo",
    id: "kyodo",
    name: "JOYFIT24経堂",
    brand: "joyfit",
    googleReviewUrl: "https://g.page/r/Cdo92khF2w03EAE/review",
    mapsUrl: "https://g.page/r/Cdo92khF2w03EAE",
    appInstallUrl: "https://joyfit.jp/kyodo/app_join/",
    appInstallIosUrl:
      "https://apps.apple.com/jp/app/joyfit-app/id1492426384?l=ja&ls=1",
    appInstallAndroidUrl:
      "https://play.google.com/store/apps/details?id=jp.joyfit.joyfitappandroid",
    appInstallBody: "JOYFITAPPから手続きが可能です",
    appInstallLinkLabel: "APPをインストール",
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
    appInstallIosUrl: "https://apps.apple.com/jp/app/fit365-app/id1521399707",
    appInstallAndroidUrl:
      "https://play.google.com/store/apps/details?id=jp.fit365.fit365appandroid",
    appInstallBody: "FIT365APPから手続きが可能です",
    appInstallLinkLabel: "APPをインストール",
  },
};

export function parseClosingStoreSlug(value: string | undefined | null): ClosingStoreSlug | null {
  if (value === "kyodo" || value === "toda") return value;
  return null;
}

export function resolveAppInstallUrl(
  store: ClosingStore,
  hints: string | { userAgent?: string; platform?: string; maxTouchPoints?: number } = "",
): string {
  const parsed = typeof hints === "string" ? { userAgent: hints } : hints;
  const ua = parsed.userAgent || "";
  const platform = parsed.platform || "";
  const touch = parsed.maxTouchPoints ?? 0;
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    ((/Mac/i.test(platform) || /Macintosh/i.test(ua)) && touch > 1);
  if (isIos) return store.appInstallIosUrl;
  if (/Android/i.test(ua) || /Android/i.test(platform)) {
    return store.appInstallAndroidUrl;
  }
  if (/Mac/i.test(ua) || /Mac/i.test(platform)) return store.appInstallIosUrl;
  return store.appInstallAndroidUrl;
}

/** @deprecated 戸田単体時の別名。CLOSING_STORES.toda を使う */
export const TODA_STORE = CLOSING_STORES.toda;

export type TodaVisitType = "kengaku" | "taiken";

export const VISIT_TYPE_LABEL: Record<TodaVisitType, string> = {
  kengaku: "見学",
  taiken: "体験",
};

export const PAGE_TITLE = "見学体験後アンケート";
export const REVIEW_LP_TITLE = "口コミ投稿";
export const REVIEW_LP_THANKS = "ご協力ありがとうございます";
export const REVIEW_LP_COPIED =
  "口コミ文をコピーしました。Googleに貼り付けて投稿できます";
export const REVIEW_LP_SUBMIT_LABEL = "口コミを投稿する";
export const REVIEW_LP_GOOGLE_AGAIN = "Googleの投稿画面を開く";

export const PHONE_FIELD_TITLE = "ご連絡先（電話番号）";
export const PHONE_HINT = "ハイフンなし";
export const PHONE_PLACEHOLDER = "09012345678";
export const PHONE_ERROR = "10桁または11桁の数字で入力してください";

export const FORM_NOTE =
  "ご入力完了後にスタッフをお呼びください ご不安な場合は、スタッフへお気軽にお申し付けください";
export const PRIVACY_NOTE =
  "お預かりした個人情報は、当店にて厳重に管理いたします";

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
  "1年以上のブランクあり",
  "現在も他のジムを利用",
  "数ヶ月以内に他店を利用",
] as const;

export const KYODO_TRAINING_TITLE = "トレーニング歴";
export const KYODO_TRAINING_OPTIONS = [
  "未経験",
  "ブランクあり",
  "2、3ヶ月",
  "1年未満",
  "1〜3年",
  "3年以上",
] as const;

export const HOW_FOUND_OPTIONS = [
  "WEB広告",
  "SNS",
  "チラシ",
  "知人・友人の紹介",
  "現地を見て",
  "その他",
] as const;

export const HOW_FOUND_TITLE = "当クラブをどこでお知りになりましたか？";
export const KYODO_HOW_FOUND_TITLE = "ご来店のきっかけを教えてください";
export const KYODO_HOW_FOUND_HINT = "当てはまるものをすべて選択";
export const KYODO_HOW_FOUND_CAMPAIGN = "限定キャンペーン";
export const KYODO_HOW_FOUND_OPTIONS = [
  KYODO_HOW_FOUND_CAMPAIGN,
  "ホームページ",
  "Googleマップ",
  "窓面写真",
  "紹介",
  "口コミ",
  "Instagram",
  "TikTok",
  "チラシ",
  "のぼり",
  "入口TV（サイネージ）",
  "その他",
] as const;

export const RATING_QUESTION =
  "当クラブを知人友人に紹介したいと思いますか？";
export const RATING_HINT = "星5で評価してください";

export const EXTRA_COMMENT_TITLE =
  "追加で何かご意見があればご記載ください";

export const JOIN_QUESTION_TITLE = "ご入会はされますか？";
export const JOIN_PERK_KICKER = "体験当日限定";
export const JOIN_PERK_AMOUNT = "1,000";
export const JOIN_PERK_UNIT = "円OFF";
export const JOIN_PERK_FEE = "翌々月の月会費";
export const JOIN_PERK_COMBO = "他キャンペーンと併用可";
export const KYODO_JOIN_PERK_KENGAKU = "見学された方限定";
export const KYODO_JOIN_PERK_TAIKEN = "体験された方限定";
export const KYODO_JOIN_PERK_AMOUNT = "500";
export const KYODO_JOIN_PERK_UNIT = "ポイント";
export const KYODO_JOIN_PERK_FEE = "エンジョイポイント";
export const JOIN_SAME_DAY_LABEL = "本日入会する";

export const JOIN_OPTIONS = [
  "本日入会する",
  "後日入会予定",
  "入会しない",
  "検討中",
] as const;

export const SESSION_MINUTES_TITLE = "利用時間";
export const SESSION_MINUTES_HINT = "10分単位";
export const SESSION_MINUTES_OPTIONS = [
  "10分",
  "20分",
  "30分",
  "40分",
  "50分",
  "60分",
  "70分",
  "80分",
  "90分",
  "それ以上",
] as const;

export const REVIEW_POSITIVES_TITLE =
  "見学・体験で、どこが良かったですか？";
export const REVIEW_POSITIVES_HINT =
  "当てはまるものをいくつかタップしてください";
export const KYODO_POSITIVES_KICKER = "印象に残ったこと";
export const KYODO_POSITIVES_TITLE = "今日、ここがよかった";
export const KYODO_POSITIVES_HINT = "気に入ったものを選んでください";
export const DRAFT_FIELD_TITLE = "ご回答内容の確認（修正できます）";
export const DRAFT_PLACEHOLDER =
  "よかった点を選ぶと、ここにご回答内容ができます";
export const SUCCESS_SAVED = "回答を保存しました";
export const SUCCESS_DRAFT_LABEL = "ご回答内容";
export const SUCCESS_GOOGLE_BUTTON_LABEL =
  "こちらからアンケートご協力をお願いします";
export const MAX_REVIEW_POSITIVES = 4;

export const REVIEW_POSITIVE_OPTIONS = [
  "スタッフの案内が丁寧",
  "店内が清潔だった",
  "マシンが充実",
  "24時間通える",
  "駐車場がある",
  "家から近い",
  "初心者でも入りやすい",
  "キャンペーンがお得",
  "セキュリティが安心",
  "雰囲気が明るい",
  "説明が分かりやすい",
  "スタッフの対応が良い",
] as const;

export const KYODO_REVIEW_POSITIVE_OPTIONS = REVIEW_POSITIVE_OPTIONS.map((opt) =>
  opt === "キャンペーンがお得" ? "6か月限定価格" : opt,
);

export function toggleLimited(
  current: string[],
  item: string,
  max: number,
): string[] {
  if (current.includes(item)) return current.filter((v) => v !== item);
  if (current.length >= max) return current;
  return [...current, item];
}

type ReviewPhrase = {
  mid: string;
  midAlso: string;
  end: string;
};

const REVIEW_POSITIVE_PHRASE: Record<string, ReviewPhrase> = {
  スタッフの案内が丁寧: {
    mid: "スタッフの案内が丁寧で",
    midAlso: "案内も丁寧で",
    end: "スタッフの案内が丁寧でした",
  },
  店内が清潔だった: {
    mid: "店内が清潔で",
    midAlso: "店内も清潔で",
    end: "店内が清潔でした",
  },
  マシンが充実: {
    mid: "マシンが充実していて",
    midAlso: "マシンも充実していて",
    end: "マシンが充実していました",
  },
  "24時間通える": {
    mid: "24時間通えて",
    midAlso: "24時間通えるのも便利で",
    end: "24時間通えるのも助かります",
  },
  駐車場がある: {
    mid: "駐車場があり",
    midAlso: "駐車場もあり",
    end: "駐車場があります",
  },
  家から近い: {
    mid: "家から近く",
    midAlso: "家からも近く",
    end: "家から近いです",
  },
  初心者でも入りやすい: {
    mid: "初心者でも入りやすく",
    midAlso: "初心者でも入りやすく",
    end: "初心者でも入りやすいです",
  },
  キャンペーンがお得: {
    mid: "キャンペーンがお得で",
    midAlso: "キャンペーンもお得で",
    end: "キャンペーンがお得でした",
  },
  "6か月限定価格": {
    mid: "6か月限定価格がお得で",
    midAlso: "6か月限定価格も魅力で",
    end: "6か月限定価格がお得でした",
  },
  セキュリティが安心: {
    mid: "セキュリティが安心で",
    midAlso: "セキュリティも安心で",
    end: "セキュリティが安心です",
  },
  雰囲気が明るい: {
    mid: "雰囲気が明るく",
    midAlso: "雰囲気も明るく",
    end: "雰囲気が明るいです",
  },
  説明が分かりやすい: {
    mid: "説明が分かりやすく",
    midAlso: "説明も分かりやすく",
    end: "説明が分かりやすかったです",
  },
  スタッフの対応が良い: {
    mid: "スタッフの対応が良く",
    midAlso: "対応も良く",
    end: "スタッフの対応が良かったです",
  },
};

function joinPositivePhrases(items: string[]): string {
  const phrases = items
    .map((item) => REVIEW_POSITIVE_PHRASE[item])
    .filter((phrase): phrase is ReviewPhrase => Boolean(phrase));
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return `${phrases[0].end}。`;
  const head = phrases
    .slice(0, -1)
    .map((phrase, index) => (index === 0 ? phrase.mid : phrase.midAlso))
    .join("、");
  return `${head}、${phrases[phrases.length - 1].end}。`;
}

export type TodaReviewDraftInput = {
  storeName: string;
  visitType: TodaVisitType;
  positives: string[];
  extraComment: string;
  rating: number;
  kyodo?: boolean;
  howFound?: string[];
};

function joinKyodoCampaignLine(positives: string[]): string {
  const extras = positives.filter((item) => item !== "6か月限定価格");
  const extraLine = joinPositivePhrases(extras);
  if (!extraLine) {
    return "今月の限定キャンペーンが6か月間ずっとお得でした。";
  }
  return `今月の限定キャンペーンが6か月間ずっとお得で、しかも${extraLine}`;
}

export function buildTodaReviewDraft(input: TodaReviewDraftInput): string {
  const visitWord = VISIT_TYPE_LABEL[input.visitType];
  const lines: string[] = [];
  if (input.kyodo) {
    lines.push(
      input.visitType === "kengaku"
        ? `${input.storeName}を無料で見学しました。`
        : `${input.storeName}で無料体験ができました。`,
    );
  } else {
    lines.push(`${input.storeName}を${visitWord}しました。`);
  }

  const campaignFound =
    input.kyodo && (input.howFound || []).includes(KYODO_HOW_FOUND_CAMPAIGN);
  const positivesLine = campaignFound
    ? joinKyodoCampaignLine(input.positives)
    : joinPositivePhrases(input.positives);
  if (positivesLine) lines.push(positivesLine);

  const comment = input.extraComment.trim();
  if (comment) lines.push(comment);

  if (!input.kyodo && input.rating >= 4) {
    lines.push(
      input.visitType === "kengaku"
        ? "見学できてよかったです。"
        : "また利用したいと思いました。",
    );
  }

  return lines.join("\n");
}
