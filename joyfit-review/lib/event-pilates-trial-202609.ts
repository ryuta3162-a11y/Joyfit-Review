/**
 * 2026.09.05-06 フレスポひばりが丘 催事スペース
 * マシンピラティス プチ体験会アンケート
 */

export const PILATES_TRIAL_EVENT = {
  slug: "pilates-trial-202609",
  eventId: "pilates-trial-202609",
  eventName: "マシンピラティス プチ体験会（2026.9.5-6）",
  title: "体験アンケート",
  subtitle: "フレスポひばりが丘 1階催事スペース",
  dateLabel: "2026年9月5日(土)・6日(日)",
  /** 口コミ誘導先店舗（スプレッドシートの店舗ID） */
  reviewStoreId: "hibarigaoka",
} as const;

export const EXPERIENCE_OPTIONS = [
  "楽しかった、面白かった",
  "あっという間だった、もっとやりたいと思った",
  "難しかった",
  "身体の左右差など、気づきがあった",
  "普段使っていない筋肉を使った感じがする",
  "その他",
] as const;

export const TRIGGER_OPTIONS = [
  "通りがけに興味を持ったから",
  "スタッフに声をかけられたから",
  "タウン通信で告知を見たため",
  "インスグラムで告知を見たため",
  "その他",
] as const;

export const INSTAGRAM_ACCOUNT_OPTIONS = [
  "JOYFIT YOGA",
  "フレスポひばりが丘",
] as const;

export const FUTURE_EVENT_OPTIONS = [
  "もう一度！マシンピラティス体験",
  "ヨガ体験",
  "姿勢分析",
  "体組成計測（体脂肪率・骨格筋量など）",
  "その他",
] as const;

export const CONCERN_OPTIONS = [
  "姿勢の崩れ（猫背・反り腰など）",
  "肩こり・腰痛",
  "ぽっこりお腹・体型の変化",
  "筋力低下・体力の衰え",
  "運動不足を感じているが何をしていいかわからない",
  "特になし",
  "その他",
] as const;

export const INTEREST_OPTIONS = [
  "ぜひ一度、無料体験レッスンを受けてみたい",
  "スケジュールや料金次第で検討したい",
  "機会があれば試してみたい",
  "いまは考えていない",
] as const;

export type PilatesTrialAnswers = {
  rating: number;
  experience: string[];
  experienceOther: string;
  triggers: string[];
  triggerOther: string;
  instagramAccounts: string[];
  futureEvents: string[];
  futureEventOther: string;
  pilatesMinutes: string;
  yogaMinutes: string;
  concerns: string[];
  concernOther: string;
  interest: string;
  impression: string;
  fullName: string;
  age: string;
  contact: string;
};

export function buildEventReviewDraft(input: Pick<PilatesTrialAnswers, "experience" | "impression" | "rating">): string {
  const lines: string[] = [];
  const positives = input.experience.filter((v) => v !== "その他" && v !== "難しかった");
  if (positives.length) {
    lines.push(`マシンピラティスの体験では、${positives.join("、")}と感じました。`);
  } else if (input.experience.includes("難しかった")) {
    lines.push("マシンピラティスの体験は少し難しかったですが、良い刺激になりました。");
  } else {
    lines.push("フレスポひばりが丘でのマシンピラティス体験に参加しました。");
  }
  const impression = input.impression.trim();
  if (impression) lines.push(impression);
  if (input.rating >= 4) {
    lines.push("また参加してみたいです。");
  }
  return lines.join("\n");
}

export function toggleMulti(current: string[], item: string): string[] {
  if (current.includes(item)) return current.filter((v) => v !== item);
  // 「特になし」は排他
  if (item === "特になし") return ["特になし"];
  if (current.includes("特になし")) return [...current.filter((v) => v !== "特になし"), item];
  return [...current, item];
}
