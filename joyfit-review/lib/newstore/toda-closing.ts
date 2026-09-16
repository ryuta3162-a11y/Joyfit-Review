/**
 * FIT365 戸田新曽 新店クロージング用
 * Googleフォーム（見学 / 無料体験）の設問をそのまま移植し、
 * その後に口コミ生成用の「よかった点」を足す。
 */

export const TODA_STORE = {
  id: "todaniizo",
  name: "FIT365 戸田新曽",
  address: "埼玉県戸田市新曽1243-1",
  officialUrl: "https://fit365.jp/todaniizo/",
  appInstallUrl: "https://fit365.jp/pr_app/",
  /** 公式サイトの Google マップ */
  mapsUrl: "https://maps.app.goo.gl/zWhH3JD89u7LyzoV9",
  /** CID からの口コミ投稿フォーム */
  googleReviewUrl:
    "https://search.google.com/local/writereview?cid=1273082332638051101",
} as const;

export type TodaVisitType = "kengaku" | "taiken";

export const VISIT_TYPE_LABEL: Record<TodaVisitType, string> = {
  kengaku: "見学",
  taiken: "無料体験",
};

export const KENGAKU_TITLE = "見学 アンケート";
export const TAIKEN_TITLE = "無料体験 アンケート";

export const KENGAKU_INTRO_LINES = [
  "ご見学ありがとうございます。",
  "ご入力完了後にスタッフをお呼びください。",
  "ご不安な場合、スタッフへお気軽にお申し付けください。",
] as const;

export const KENGAKU_NOTES = [
  "※お問い合わせは店舗スタッフ、またはメールにて承ります。",
  "※お預かりした個人情報は、当店にて厳重に管理いたします。",
] as const;

export const TAIKEN_INTRO_LINES = [
  "お申込みありがとうございます。",
  "ご入力完了後にスタッフをお呼びください。",
  "ご不安な場合、スタッフへお気軽にお申し付けください。",
] as const;

export const TAIKEN_HOURS_TITLE = "【体験可能時間】";
export const TAIKEN_HOURS = "10:00-19:00";

export const TAIKEN_NOTES = [
  "※お一人様1回限りとさせていただきます。",
  "※お問い合わせは店舗スタッフ、またはメールにて承ります。",
  "※お預かりした個人情報は、当店にて厳重に管理いたします。",
] as const;

export const GENDER_OPTIONS = ["男性", "女性", "回答しない"] as const;

export const AGE_OPTIONS = [
  "10代",
  "20代（学生）",
  "20代（社会人）",
  "30代",
  "40代",
  "50代",
  "60代",
  "70代以上",
] as const;

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

export const NPS_MIN = 1;
export const NPS_MAX = 10;
export const NPS_QUESTION =
  "当クラブを知人友人に紹介したいと思いますか？";
export const NPS_SCALE_HINT =
  "★1あまりオススメしない～★10とてもおすすめしたい";

export const JOIN_QUESTION_TITLE = "ご入会はされますか？";
export const JOIN_QUESTION_CAMPAIGN_LINES = [
  "💡体験当日のご入会者限定💡",
  "翌々月の月会費1,000円OFF！",
  "キャンペーンと併用可！",
] as const;
export const JOIN_QUESTION_NOTE =
  "※本日入会すると回答した方に適用されます。";

export const JOIN_OPTIONS = [
  "本日入会する（会費1,000円OFF）",
  "後日入会予定",
  "入会しない",
  "検討中",
] as const;

export const APP_SECTION_TITLE = "入会ご希望の方へ";
export const APP_SECTION_BODY =
  "FIT365アプリよりご入会手続きが可能でございます！";
export const APP_SECTION_LINK_LABEL = "アプリインストールはこちら";

/** 口コミ生成用（Googleフォームには無い追加パート） */
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

const REVIEW_CLOSINGS = [
  "通いやすく、また利用したいと思いました。",
  "これからも通いたいジムです。",
  "見学してよかったです。",
] as const;

export function npsToGoogleStars(nps: number): number {
  if (nps >= 9) return 5;
  if (nps >= 7) return 4;
  if (nps >= 5) return 3;
  if (nps >= 3) return 2;
  return 1;
}

function formatEnumPhrases(items: string[]): string {
  const list = items.filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join("、")}や${list[list.length - 1]}`;
}

export function toggleLimited(
  current: string[],
  item: string,
  max: number,
): string[] {
  if (current.includes(item)) return current.filter((v) => v !== item);
  if (current.length >= max) return current;
  return [...current, item];
}

export type TodaReviewDraftInput = {
  visitType: TodaVisitType;
  positives: string[];
  npsReason: string;
  facilityComment: string;
  googleRating: number;
};

export function buildTodaReviewDraft(input: TodaReviewDraftInput): string {
  const visitWord = VISIT_TYPE_LABEL[input.visitType];
  const lines: string[] = [];
  lines.push(`FIT365戸田新曽を${visitWord}しました。`);

  if (input.positives.length) {
    lines.push(
      `${formatEnumPhrases(input.positives)}と感じました。`,
    );
  }

  const reason = input.npsReason.trim();
  if (reason) lines.push(reason);

  const comment = input.facilityComment.trim();
  if (comment && comment !== reason) lines.push(comment);

  if (input.googleRating >= 4) {
    lines.push(
      input.visitType === "kengaku" ? REVIEW_CLOSINGS[2] : REVIEW_CLOSINGS[0],
    );
  }

  return lines.join("\n");
}
