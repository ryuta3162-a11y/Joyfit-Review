/**
 * 口コミアンケートの選択肢・生成文テンプレート
 * 文言の添削はこのファイルを編集してください。
 */

/** 各ステップで選べる最大数 */
export const MAX_PICKS_PER_SECTION = 2;

/** 画面表示用のステップ見出し */
export const reviewSectionLabels = {
  service: "サービス面で気に入っている点",
  environment: "環境・設備で良かった点",
  audience: "どんな方へおすすめですか？",
} as const;

/** ① サービス面 */
export const menuServiceOptions = [
  "24時間いつでも通える",
  "年中無休で利用しやすい",
  "全国相互利用可能",
  "初心者に優しい",
  "マシンが使いやすい",
  "スタッフの対応が良い",
  "パーソナルトレーニング",
  "利用マナーが良い",
  "フリーウエイトが充実",
  "空いていて利用しやすい",
  "オプションメニューが充実",
] as const;

/** ② 環境・設備 */
export const environmentOptions = [
  "駅チカで通いやすい",
  "セキュリティ面が安心",
  "施設が清潔で使いやすい",
  "トレーニングに集中できる",
  "通いやすい立地",
  "鍵付きロッカー",
  "フリーWi-Fiが使える",
  "土足利用可能",
  "マシンメンテナンスが行き届いている",
] as const;

/** ③ おすすめの対象 */
export const sceneOptions = [
  "24時間ジムを探している方に",
  "自分のペースでトレーニング",
  "仕事帰りにサクッと筋トレ",
  "運動不足にお悩みの方に",
  "スキマ時間に体を動かしたい",
  "運動でストレス発散したい方に",
  "安心安全に夜間利用したい",
  "理想の体型を目指したい方に",
  "健康維持にジムを使いたい",
  "全国のJOYFITを活用したい方に",
] as const;

type ReviewDraftInput = {
  service: string[];
  environment: string[];
  audience: string[];
  freeComment?: string;
};

type ReviewPattern = {
  lines: Array<(input: ReviewDraftInput) => string | "">;
};

/** 締めの文（型とは独立してランダム採用 → 同じ型でも結びが変わる） */
const reviewClosingLines = [
  "今後も通い続けたいジムだと感じました。",
  "また利用したいと思えるジムです。",
  "これからも続けて通いたいです。",
  "通いやすく、気に入っているジムです。",
  "お気に入りのジムになりそうです。",
  "継続して通える場所が見つかってよかったです。",
  "全体的に満足しており、また通いたいです。",
  "気軽に通えて、続けやすいジムだと思います。",
  "また来たいと思える環境でした。",
  "長く通いたいと感じられるジムです。",
] as const;

/** 口コミ文用：選択肢を読点・「や」で列挙（「AとBが」にならない） */
export function formatEnumPhrases(items: string[]): string {
  const list = items.filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join("、")}や${list[list.length - 1]}`;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** 「など」を付けるかどうか（毎回同じになりにくくする） */
function nado(): string {
  return Math.random() < 0.65 ? "など" : "";
}

/** 生成用に選択順をシャッフル（タップ順に依存しない） */
function prepareDraftInput(input: ReviewDraftInput): ReviewDraftInput {
  return {
    service: shuffleOptions(input.service),
    environment: shuffleOptions(input.environment),
    audience: shuffleOptions(input.audience),
    freeComment: input.freeComment,
  };
}

/** 口コミ生成：6パターンからランダムに1つ採用 */
const reviewDraftPatterns: ReviewPattern[] = [
  {
    lines: [
      (i) => {
        const blocks: string[] = [];
        if (i.service.length) {
          blocks.push(
            `サービス面は、${formatEnumPhrases(i.service)}${nado()}が特に気に入りました。`,
          );
        }
        if (i.environment.length) {
          blocks.push(
            `環境・設備は、${formatEnumPhrases(i.environment)}${nado()}が魅力です。`,
          );
        }
        if (i.audience.length) {
          blocks.push(`こんな方におすすめです：${i.audience.join("、")}`);
        }
        return shuffleOptions(blocks).join("\n");
      },
    ],
  },
  {
    lines: [
      (i) => {
        const parts: string[] = [];
        if (i.service.length) {
          parts.push(`${formatEnumPhrases(i.service)}${nado()}、サービス面が印象的でした`);
        }
        if (i.environment.length) {
          parts.push(`${formatEnumPhrases(i.environment)}${nado()}、設備面も気に入っています`);
        }
        if (!parts.length) return "";
        return shuffleOptions(parts).join("。") + "。";
      },
      (i) =>
        i.audience.length
          ? `${formatEnumPhrases(i.audience)}といった方にぴったりだと思います。`
          : "",
    ],
  },
  {
    lines: [
      (i) => {
        const parts: string[] = [];
        if (i.service.length) {
          parts.push(`利用してみて、${formatEnumPhrases(i.service)}${nado()}が良いと感じました`);
        }
        if (i.environment.length) {
          parts.push(`施設は${formatEnumPhrases(i.environment)}${nado()}も魅力です`);
        }
        if (!parts.length) return "館内が使いやすく、通いやすいと感じました。";
        return shuffleOptions(parts).join("。") + "。";
      },
      (i) =>
        i.audience.length
          ? `おすすめは、${i.audience.join("、")}といった方です。`
          : "",
    ],
  },
  {
    lines: [
      (i) => {
        if (i.service.length && i.environment.length) {
          const lead = pickRandom([
            "通ってみて、",
            "実際に使ってみると、",
            "利用してみて、",
          ]);
          return `${lead}${formatEnumPhrases(i.service)}${nado()}のサービス面と、${formatEnumPhrases(i.environment)}${nado()}の設備面の両方が良かったです。`;
        }
        if (i.service.length) {
          return `通ってみて、${formatEnumPhrases(i.service)}${nado()}のサービス面が良かったです。`;
        }
        if (i.environment.length) {
          return `通ってみて、${formatEnumPhrases(i.environment)}${nado()}の設備面が良かったです。`;
        }
        return "";
      },
      (i) =>
        i.audience.length
          ? `${formatEnumPhrases(i.audience)}の方にもおすすめしたいです。`
          : "",
    ],
  },
  {
    lines: [
      (i) => {
        const blocks: string[] = [];
        if (i.service.length) {
          blocks.push(`特に${formatEnumPhrases(i.service)}${nado()}が印象に残りました。`);
        }
        if (i.environment.length) {
          blocks.push(`${formatEnumPhrases(i.environment)}${nado()}もありがたいポイントです。`);
        }
        if (i.audience.length) {
          blocks.push(`おすすめしたいのは、${i.audience.join("、")}といった方です。`);
        }
        return shuffleOptions(blocks).join("\n");
      },
    ],
  },
  {
    lines: [
      (i) =>
        i.audience.length
          ? `まず、${formatEnumPhrases(i.audience)}といった方に合うジムだと感じました。`
          : "",
      (i) => {
        const parts: string[] = [];
        if (i.service.length) {
          parts.push(`${formatEnumPhrases(i.service)}${nado()}のサービス`);
        }
        if (i.environment.length) {
          parts.push(`${formatEnumPhrases(i.environment)}${nado()}の設備`);
        }
        if (!parts.length) return "";
        const tail = pickRandom(["にも満足しています。", "も気に入っています。"]);
        return `${shuffleOptions(parts).join("と")}${tail}`;
      },
    ],
  },
];

/** @deprecated 口コミ生成では formatEnumPhrases を使用 */
export function formatPhraseList(items: string[]): string {
  return formatEnumPhrases(items);
}

export function buildReviewDraft(input: ReviewDraftInput): string {
  const draftInput = prepareDraftInput(input);
  const pattern = pickRandom(reviewDraftPatterns);
  const body = pattern.lines
    .flatMap((line) =>
      line(draftInput)
        .trim()
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  const extra = (input.freeComment || "").trim();
  if (extra) body.push(extra);
  if (body.length === 0) {
    return pickRandom(reviewClosingLines);
  }
  body.push(pickRandom(reviewClosingLines));
  return body.join("\n");
}

/** 表示のたびに選択肢の並びをランダム化（Fisher–Yates） */
export function shuffleOptions<T>(items: readonly T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

/** 最大 max 個までトグル選択 */
export function toggleLimitedPick(
  current: string[],
  item: string,
  max: number = MAX_PICKS_PER_SECTION,
): string[] {
  if (current.includes(item)) {
    return current.filter((v) => v !== item);
  }
  if (current.length >= max) return current;
  return [...current, item];
}
