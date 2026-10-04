import type { TodaVisitType } from "@/lib/newstore/toda-closing";

export const KYODO_VISIBLE_CHIP_COUNT = 12;

type PhraseVariant = {
  mid: string;
  midAlso: string;
  end: string;
  sentence: string;
};

type ChipKind = "common" | "taiken" | "kengaku";

type ChipDef = {
  label: string;
  kind: ChipKind;
  variants: PhraseVariant[];
};

const CHIPS: ChipDef[] = [
  {
    label: "スタッフの案内が丁寧",
    kind: "common",
    variants: [
      {
        mid: "スタッフの案内が丁寧で",
        midAlso: "案内も丁寧で",
        end: "スタッフの案内が丁寧でした",
        sentence: "スタッフの案内が丁寧でした。",
      },
      {
        mid: "案内が分かりやすく",
        midAlso: "案内も分かりやすく",
        end: "案内が分かりやすかったです",
        sentence: "案内が分かりやすく安心しました。",
      },
      {
        mid: "丁寧に案内してもらえて",
        midAlso: "丁寧に案内してもらえて",
        end: "丁寧に案内してもらえました",
        sentence: "丁寧に案内してもらえました。",
      },
    ],
  },
  {
    label: "店内が清潔だった",
    kind: "common",
    variants: [
      {
        mid: "店内が清潔で",
        midAlso: "店内も清潔で",
        end: "店内が清潔でした",
        sentence: "店内が清潔でした。",
      },
      {
        mid: "店内がきれいで",
        midAlso: "店内もきれいで",
        end: "店内がきれいでした",
        sentence: "店内がきれいでした。",
      },
      {
        mid: "清潔感があって",
        midAlso: "清潔感もあり",
        end: "清潔感がありました",
        sentence: "清潔感があって気持ちよかったです。",
      },
    ],
  },
  {
    label: "マシンが充実",
    kind: "common",
    variants: [
      {
        mid: "マシンが充実していて",
        midAlso: "マシンも充実していて",
        end: "マシンが充実していました",
        sentence: "マシンが充実していました。",
      },
      {
        mid: "器具の種類が多くて",
        midAlso: "器具の種類も多くて",
        end: "器具の種類が多かったです",
        sentence: "器具の種類が多くて選びやすかったです。",
      },
      {
        mid: "マシンが揃っていて",
        midAlso: "マシンも揃っていて",
        end: "マシンが揃っていました",
        sentence: "マシンがしっかり揃っていました。",
      },
    ],
  },
  {
    label: "24時間通える",
    kind: "common",
    variants: [
      {
        mid: "24時間通えて",
        midAlso: "24時間通えるのも便利で",
        end: "24時間通えるのも助かりました",
        sentence: "24時間通えるのが助かりました。",
      },
      {
        mid: "好きな時間に通えて",
        midAlso: "好きな時間に通えるのもよくて",
        end: "好きな時間に通えました",
        sentence: "好きな時間に通えるのがよかったです。",
      },
      {
        mid: "昼夜問わず使えて",
        midAlso: "昼夜問わず使えるのも便利で",
        end: "昼夜問わず使えました",
        sentence: "昼夜問わず使えるので通いやすかったです。",
      },
    ],
  },
  {
    label: "駐車場がある",
    kind: "common",
    variants: [
      {
        mid: "駐車場があり",
        midAlso: "駐車場もあり",
        end: "駐車場があります",
        sentence: "駐車場があるので通いやすいです。",
      },
      {
        mid: "車で来やすく",
        midAlso: "車でも来やすく",
        end: "車で来やすかったです",
        sentence: "車で来やすいのがよかったです。",
      },
      {
        mid: "駐車できて",
        midAlso: "駐車もできて",
        end: "駐車できました",
        sentence: "駐車できるので助かりました。",
      },
    ],
  },
  {
    label: "家から近い",
    kind: "common",
    variants: [
      {
        mid: "家から近く",
        midAlso: "家からも近く",
        end: "家から近かったです",
        sentence: "家から近かったです。",
      },
      {
        mid: "通いやすい距離で",
        midAlso: "通いやすい距離でもあり",
        end: "通いやすい距離でした",
        sentence: "通いやすい距離でした。",
      },
      {
        mid: "近くて便利で",
        midAlso: "近くて便利なのもよくて",
        end: "近くて便利でした",
        sentence: "近くて便利でした。",
      },
    ],
  },
  {
    label: "初心者でも入りやすい",
    kind: "common",
    variants: [
      {
        mid: "初心者でも入りやすく",
        midAlso: "初心者でも入りやすく",
        end: "初心者でも入りやすかったです",
        sentence: "初心者でも入りやすかったです。",
      },
      {
        mid: "初めてでも安心で",
        midAlso: "初めてでも安心で",
        end: "初めてでも安心でした",
        sentence: "初めてでも安心できました。",
      },
      {
        mid: "初めてでも入りやすくて",
        midAlso: "初めてでも入りやすくて",
        end: "初めてでも入りやすかったです",
        sentence: "初めてでも入りやすかったです。",
      },
    ],
  },
  {
    label: "6か月限定価格",
    kind: "common",
    variants: [
      {
        mid: "{month}限定で6か月ずっと2,990円で",
        midAlso: "{month}限定で6か月ずっと2,990円でもあり",
        end: "{month}限定で6か月ずっと2,990円でした",
        sentence: "{month}限定で、6か月間ずっと2,990円なのがお得でした。",
      },
      {
        mid: "6か月間ずっと月額2,990円で",
        midAlso: "6か月間ずっと月額2,990円でもあり",
        end: "6か月間ずっと月額2,990円でした",
        sentence: "6か月間ずっと月額2,990円のキャンペーンがありました。",
      },
      {
        mid: "最初の6か月が2,990円で始めやすくて",
        midAlso: "最初の6か月も2,990円で始めやすくて",
        end: "最初の6か月が2,990円で始めやすかったです",
        sentence: "最初の6か月が2,990円で始めやすかったです。",
      },
    ],
  },
  {
    label: "セキュリティが安心",
    kind: "common",
    variants: [
      {
        mid: "セキュリティが安心で",
        midAlso: "セキュリティも安心で",
        end: "セキュリティが安心でした",
        sentence: "セキュリティが安心でした。",
      },
      {
        mid: "防犯面がしっかりしていて",
        midAlso: "防犯面もしっかりしていて",
        end: "防犯面がしっかりしていました",
        sentence: "防犯面がしっかりしていて安心しました。",
      },
      {
        mid: "出入りが管理されていて",
        midAlso: "出入りも管理されていて",
        end: "出入りが管理されていました",
        sentence: "出入りが管理されていて安心できました。",
      },
    ],
  },
  {
    label: "雰囲気が明るい",
    kind: "common",
    variants: [
      {
        mid: "雰囲気が明るく",
        midAlso: "雰囲気も明るく",
        end: "雰囲気が明るいです",
        sentence: "雰囲気が明るいです。",
      },
      {
        mid: "雰囲気がよくて",
        midAlso: "雰囲気もよくて",
        end: "雰囲気がよかったです",
        sentence: "雰囲気がよかったです。",
      },
      {
        mid: "明るくて通いやすく",
        midAlso: "明るくて通いやすく",
        end: "明るくて通いやすいです",
        sentence: "明るくて通いやすい雰囲気でした。",
      },
    ],
  },
  {
    label: "説明が分かりやすい",
    kind: "common",
    variants: [
      {
        mid: "説明が分かりやすく",
        midAlso: "説明も分かりやすく",
        end: "説明が分かりやすかったです",
        sentence: "説明が分かりやすかったです。",
      },
      {
        mid: "話が簡潔で",
        midAlso: "話も簡潔で",
        end: "話が簡潔でした",
        sentence: "説明が簡潔で分かりやすかったです。",
      },
      {
        mid: "聞きたいことが聞けて",
        midAlso: "聞きたいことも聞けて",
        end: "聞きたいことが聞けました",
        sentence: "聞きたいことが聞けました。",
      },
    ],
  },
  {
    label: "スタッフの対応が良い",
    kind: "common",
    variants: [
      {
        mid: "スタッフの対応が良く",
        midAlso: "対応も良く",
        end: "スタッフの対応が良かったです",
        sentence: "スタッフの対応が良かったです。",
      },
      {
        mid: "接客が気持ちよく",
        midAlso: "接客も気持ちよく",
        end: "接客が気持ちよかったです",
        sentence: "接客が気持ちよかったです。",
      },
      {
        mid: "対応がスムーズで",
        midAlso: "対応もスムーズで",
        end: "対応がスムーズでした",
        sentence: "スタッフの対応がスムーズでした。",
      },
    ],
  },
  {
    label: "受付がスムーズ",
    kind: "common",
    variants: [
      {
        mid: "受付がスムーズで",
        midAlso: "受付もスムーズで",
        end: "受付がスムーズでした",
        sentence: "受付がスムーズでした。",
      },
      {
        mid: "手続きが早くて",
        midAlso: "手続きも早くて",
        end: "手続きが早かったです",
        sentence: "手続きが早くて楽でした。",
      },
      {
        mid: "待たされずに済んで",
        midAlso: "待たされずに済んで",
        end: "待たされずに済みました",
        sentence: "待たされずに済みました。",
      },
    ],
  },
  {
    label: "店内が広い",
    kind: "common",
    variants: [
      {
        mid: "店内が広く",
        midAlso: "店内も広く",
        end: "店内が広かったです",
        sentence: "店内が広かったです。",
      },
      {
        mid: "スペースに余裕があって",
        midAlso: "スペースにも余裕があって",
        end: "スペースに余裕がありました",
        sentence: "スペースに余裕があって動きやすかったです。",
      },
      {
        mid: "窮屈じゃなくて",
        midAlso: "窮屈じゃなくて",
        end: "窮屈じゃなかったです",
        sentence: "窮屈さがなくて使いやすかったです。",
      },
    ],
  },
  {
    label: "設備が新しい",
    kind: "common",
    variants: [
      {
        mid: "設備が新しく",
        midAlso: "設備も新しく",
        end: "設備が新しかったです",
        sentence: "設備が新しかったです。",
      },
      {
        mid: "マシンがきれいで",
        midAlso: "マシンもきれいで",
        end: "マシンがきれいでした",
        sentence: "マシンがきれいでした。",
      },
      {
        mid: "新しい器具が多くて",
        midAlso: "新しい器具も多くて",
        end: "新しい器具が多かったです",
        sentence: "新しい器具が多くて好印象でした。",
      },
    ],
  },
  {
    label: "更衣室がきれい",
    kind: "common",
    variants: [
      {
        mid: "更衣室がきれいで",
        midAlso: "更衣室もきれいで",
        end: "更衣室がきれいでした",
        sentence: "更衣室がきれいでした。",
      },
      {
        mid: "着替えやすくて",
        midAlso: "着替えやすくて",
        end: "着替えやすかったです",
        sentence: "更衣室が使いやすかったです。",
      },
      {
        mid: "ロッカースペースが整っていて",
        midAlso: "ロッカースペースも整っていて",
        end: "ロッカースペースが整っていました",
        sentence: "ロッカースペースが整っていました。",
      },
    ],
  },
  {
    label: "夜でも通いやすい",
    kind: "common",
    variants: [
      {
        mid: "夜でも通いやすく",
        midAlso: "夜でも通いやすく",
        end: "夜でも通いやすいです",
        sentence: "夜でも通いやすいです。",
      },
      {
        mid: "仕事帰りに寄りやすく",
        midAlso: "仕事帰りにも寄りやすく",
        end: "仕事帰りに寄りやすいです",
        sentence: "仕事帰りに寄りやすいのがよいです。",
      },
      {
        mid: "遅い時間でも使いやすく",
        midAlso: "遅い時間でも使いやすく",
        end: "遅い時間でも使いやすいです",
        sentence: "遅い時間でも使いやすそうでした。",
      },
    ],
  },
  {
    label: "駅から近い",
    kind: "common",
    variants: [
      {
        mid: "駅から近く",
        midAlso: "駅からも近く",
        end: "駅から近いです",
        sentence: "駅から近いです。",
      },
      {
        mid: "アクセスがよくて",
        midAlso: "アクセスもよくて",
        end: "アクセスがよかったです",
        sentence: "アクセスがよかったです。",
      },
      {
        mid: "立ち寄りやすく",
        midAlso: "立ち寄りやすく",
        end: "立ち寄りやすいです",
        sentence: "立ち寄りやすい立地でした。",
      },
    ],
  },
  {
    label: "空いていて使いやすい",
    kind: "common",
    variants: [
      {
        mid: "空いていて使いやすく",
        midAlso: "空いていて使いやすく",
        end: "空いていて使いやすかったです",
        sentence: "空いていて使いやすかったです。",
      },
      {
        mid: "混みすぎていなくて",
        midAlso: "混みすぎていなくて",
        end: "混みすぎていませんでした",
        sentence: "混みすぎていなくて動きやすかったです。",
      },
      {
        mid: "マシンが空いていて",
        midAlso: "マシンも空いていて",
        end: "マシンが空いていました",
        sentence: "マシンが空いていて使いやすかったです。",
      },
    ],
  },
  {
    label: "空調がちょうどいい",
    kind: "common",
    variants: [
      {
        mid: "空調がちょうどよく",
        midAlso: "空調もちょうどよく",
        end: "空調がちょうどよかったです",
        sentence: "空調がちょうどよかったです。",
      },
      {
        mid: "室温が快適で",
        midAlso: "室温も快適で",
        end: "室温が快適でした",
        sentence: "室温が快適でした。",
      },
      {
        mid: "暑すぎず過ごしやすく",
        midAlso: "暑すぎず過ごしやすく",
        end: "過ごしやすかったです",
        sentence: "暑すぎず過ごしやすかったです。",
      },
    ],
  },
  {
    label: "スタッフが親切",
    kind: "common",
    variants: [
      {
        mid: "スタッフが親切で",
        midAlso: "スタッフも親切で",
        end: "スタッフが親切でした",
        sentence: "スタッフが親切でした。",
      },
      {
        mid: "声をかけやすくて",
        midAlso: "声もかけやすくて",
        end: "声をかけやすかったです",
        sentence: "スタッフに声をかけやすかったです。",
      },
      {
        mid: "感じがよくて",
        midAlso: "感じもよくて",
        end: "感じがよかったです",
        sentence: "スタッフの感じがよかったです。",
      },
    ],
  },
  {
    label: "入会しやすい",
    kind: "common",
    variants: [
      {
        mid: "入会しやすく",
        midAlso: "入会しやすく",
        end: "入会しやすいです",
        sentence: "入会しやすい印象でした。",
      },
      {
        mid: "始め方が分かりやすく",
        midAlso: "始め方も分かりやすく",
        end: "始め方が分かりやすかったです",
        sentence: "始め方が分かりやすかったです。",
      },
      {
        mid: "手続きが簡単そうで",
        midAlso: "手続きも簡単そうで",
        end: "手続きが簡単そうでした",
        sentence: "手続きが簡単そうでした。",
      },
    ],
  },
  {
    label: "有酸素が充実",
    kind: "common",
    variants: [
      {
        mid: "有酸素が充実していて",
        midAlso: "有酸素も充実していて",
        end: "有酸素が充実していました",
        sentence: "有酸素マシンが充実していました。",
      },
      {
        mid: "ランニングマシンが多くて",
        midAlso: "ランニングマシンも多くて",
        end: "ランニングマシンが多かったです",
        sentence: "ランニングマシンが多かったです。",
      },
      {
        mid: "有酸素エリアが使いやすく",
        midAlso: "有酸素エリアも使いやすく",
        end: "有酸素エリアが使いやすかったです",
        sentence: "有酸素エリアが使いやすかったです。",
      },
    ],
  },
  {
    label: "静かで集中できる",
    kind: "common",
    variants: [
      {
        mid: "静かで集中できて",
        midAlso: "静かで集中できて",
        end: "静かで集中できます",
        sentence: "静かで集中できました。",
      },
      {
        mid: "落ち着いた雰囲気で",
        midAlso: "落ち着いた雰囲気でもあり",
        end: "落ち着いた雰囲気でした",
        sentence: "落ち着いた雰囲気でした。",
      },
      {
        mid: "気が散りにくくて",
        midAlso: "気が散りにくくて",
        end: "気が散りにくかったです",
        sentence: "気が散りにくくてよかったです。",
      },
    ],
  },
  {
    label: "使い方を教えてくれた",
    kind: "taiken",
    variants: [
      {
        mid: "使い方を教えてもらえて",
        midAlso: "使い方も教えてもらえて",
        end: "使い方を教えてもらえました",
        sentence: "マシンの使い方を教えてもらえました。",
      },
      {
        mid: "実演してもらえて",
        midAlso: "実演してもらえて",
        end: "実演してもらえました",
        sentence: "実際の使い方を見せてもらえました。",
      },
      {
        mid: "丁寧に教えてもらえて",
        midAlso: "丁寧に教えてもらえて",
        end: "丁寧に教えてもらえました",
        sentence: "丁寧に教えてもらえました。",
      },
    ],
  },
  {
    label: "体験が分かりやすい",
    kind: "taiken",
    variants: [
      {
        mid: "体験の流れが分かりやすく",
        midAlso: "体験の流れも分かりやすく",
        end: "体験の流れが分かりやすかったです",
        sentence: "体験の流れが分かりやすかったです。",
      },
      {
        mid: "体験しやすく",
        midAlso: "体験しやすく",
        end: "体験しやすかったです",
        sentence: "体験しやすかったです。",
      },
      {
        mid: "初めてでも動けて",
        midAlso: "初めてでも動けて",
        end: "初めてでも動けました",
        sentence: "初めてでも動けました。",
      },
    ],
  },
  {
    label: "マシンを触れた",
    kind: "taiken",
    variants: [
      {
        mid: "マシンを実際に使えて",
        midAlso: "マシンも実際に使えて",
        end: "マシンを実際に使えました",
        sentence: "マシンを実際に使えました。",
      },
      {
        mid: "器具を体験できて",
        midAlso: "器具も体験できて",
        end: "器具を体験できました",
        sentence: "器具を体験できました。",
      },
      {
        mid: "使ってみて分かって",
        midAlso: "使ってみて分かって",
        end: "使ってみて分かりました",
        sentence: "使ってみて雰囲気が分かりました。",
      },
    ],
  },
  {
    label: "見学しやすかった",
    kind: "kengaku",
    variants: [
      {
        mid: "見学しやすく",
        midAlso: "見学しやすく",
        end: "見学しやすかったです",
        sentence: "見学しやすかったです。",
      },
      {
        mid: "店内を回りやすく",
        midAlso: "店内も回りやすく",
        end: "店内を回りやすかったです",
        sentence: "店内を回りやすかったです。",
      },
      {
        mid: "見学の流れがスムーズで",
        midAlso: "見学の流れもスムーズで",
        end: "見学の流れがスムーズでした",
        sentence: "見学の流れがスムーズでした。",
      },
    ],
  },
  {
    label: "店内をしっかり見れた",
    kind: "kengaku",
    variants: [
      {
        mid: "店内をしっかり見られて",
        midAlso: "店内もしっかり見られて",
        end: "店内をしっかり見られました",
        sentence: "店内をしっかり見られました。",
      },
      {
        mid: "設備を確認できて",
        midAlso: "設備も確認できて",
        end: "設備を確認できました",
        sentence: "設備を確認できました。",
      },
      {
        mid: "全体の様子が分かって",
        midAlso: "全体の様子も分かって",
        end: "全体の様子が分かりました",
        sentence: "全体の様子が分かりました。",
      },
    ],
  },
  {
    label: "質問しやすかった",
    kind: "kengaku",
    variants: [
      {
        mid: "質問しやすく",
        midAlso: "質問しやすく",
        end: "質問しやすかったです",
        sentence: "質問しやすかったです。",
      },
      {
        mid: "聞きたいことを聞けて",
        midAlso: "聞きたいことも聞けて",
        end: "聞きたいことを聞けました",
        sentence: "聞きたいことを聞けました。",
      },
      {
        mid: "気軽に確認できて",
        midAlso: "気軽に確認できて",
        end: "気軽に確認できました",
        sentence: "気軽に確認できました。",
      },
    ],
  },
];

const OPENINGS: Record<TodaVisitType, ((name: string) => string)[]> = {
  taiken: [
    (name) => `${name}で無料体験してきました。`,
    (name) => `${name}の無料体験に行ってきました。`,
    (name) => `${name}で無料体験ができました。`,
    (name) => `無料体験で${name}に寄ってみました。`,
    (name) => `${name}を無料で体験してきました。`,
  ],
  kengaku: [
    (name) => `${name}を無料で見学してきました。`,
    (name) => `${name}へ無料見学に行ってきました。`,
    (name) => `${name}を無料で見学しました。`,
    (name) => `無料で${name}を見学してきました。`,
    (name) => `${name}の店内を無料で見せてもらいました。`,
  ],
};

function campaignMonthLabel(): string {
  return `${new Date().getMonth() + 1}月`;
}

function fillCampaignCopy(text: string): string {
  return text.replaceAll("{month}", campaignMonthLabel());
}

const CAMPAIGN_ONLY = [
  "{month}限定で、6か月間ずっと2,990円なのがお得でした。",
  "{month}のキャンペーンで、6か月ずっと2,990円でした。",
  "6か月間ずっと月額2,990円のキャンペーンがありました。",
  "{month}限定の2,990円キャンペーンがあって、始めやすかったです。",
];

const CAMPAIGN_LEAD = [
  (extra: string) => `{month}限定で6か月ずっと2,990円で、${extra}`,
  (extra: string) => `6か月2,990円のキャンペーンもあって、${extra}`,
  (extra: string) => `{month}のキャンペーンが6か月2,990円なのと、${extra}`,
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(seed: number, key: string): () => number {
  return mulberry32(seed ^ hashString(key));
}

function pickIndex(length: number, rng: () => number): number {
  if (length <= 1) return 0;
  return Math.floor(rng() * length);
}

function shuffleInPlace<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = pickIndex(i + 1, rng);
    const current = items[i];
    const swap = items[j];
    if (current === undefined || swap === undefined) continue;
    items[i] = swap;
    items[j] = current;
  }
  return items;
}

function chipsByKind(kind: ChipKind): ChipDef[] {
  return CHIPS.filter((chip) => chip.kind === kind);
}

export function pickKyodoReviewChips(
  seed: number,
  visitType: TodaVisitType | null,
): string[] {
  const rng = rngFor(seed, `chips:${visitType ?? "none"}`);
  const common = shuffleInPlace([...chipsByKind("common")], rng);
  const extras =
    visitType === "taiken"
      ? shuffleInPlace([...chipsByKind("taiken")], rng)
      : visitType === "kengaku"
        ? shuffleInPlace([...chipsByKind("kengaku")], rng)
        : [];
  const extraCount = visitType ? Math.min(2, extras.length) : 0;
  const chosenExtras = extras.slice(0, extraCount);
  const extraLabels = new Set(chosenExtras.map((chip) => chip.label));
  const needed = Math.max(0, KYODO_VISIBLE_CHIP_COUNT - chosenExtras.length);
  const chosenCommon = common
    .filter((chip) => !extraLabels.has(chip.label))
    .slice(0, needed);
  return shuffleInPlace([...chosenExtras, ...chosenCommon], rng).map(
    (chip) => chip.label,
  );
}

function phraseFor(label: string, seed: number): PhraseVariant | null {
  const chip = CHIPS.find((item) => item.label === label);
  if (!chip) return null;
  const rng = rngFor(seed, `phrase:${label}`);
  const picked = chip.variants[pickIndex(chip.variants.length, rng)];
  if (!picked) return null;
  return {
    mid: fillCampaignCopy(picked.mid),
    midAlso: fillCampaignCopy(picked.midAlso),
    end: fillCampaignCopy(picked.end),
    sentence: fillCampaignCopy(picked.sentence),
  };
}

function joinChained(phrases: PhraseVariant[]): string {
  if (phrases.length === 1) {
    const only = phrases[0];
    return only ? `${only.end}。` : "";
  }
  const last = phrases[phrases.length - 1];
  if (!last) return "";
  const head = phrases
    .slice(0, -1)
    .map((phrase, index) => (index === 0 ? phrase.mid : phrase.midAlso))
    .join("、");
  return `${head}、${last.end}。`;
}

function joinTwoBeats(phrases: PhraseVariant[]): string {
  if (phrases.length <= 2) return joinChained(phrases);
  const first = joinChained(phrases.slice(0, 2));
  const rest = phrases.slice(2);
  const last = rest[rest.length - 1];
  if (!last) return first;
  if (rest.length === 1) return `${first}${last.sentence}`;
  return `${first}${joinChained(rest)}`;
}

export function buildKyodoReviewDraft(input: {
  storeName: string;
  visitType: TodaVisitType;
  positives: string[];
  seed: number;
  howFound?: string[];
  extraComment?: string;
}): string {
  const openRng = rngFor(input.seed, `open:${input.visitType}`);
  const joinRng = rngFor(input.seed, "join");
  const orderRng = rngFor(input.seed, "order");
  const campaignRng = rngFor(input.seed, "campaign");
  const openings = OPENINGS[input.visitType];
  const openingFn = openings[pickIndex(openings.length, openRng)];
  const opening = openingFn ? openingFn(input.storeName) : "";

  const campaignFound = (input.howFound || []).includes("限定キャンペーン");
  const labels = shuffleInPlace(
    input.positives.filter((label) =>
      campaignFound ? label !== "6か月限定価格" : true,
    ),
    orderRng,
  );
  const phrases = labels
    .map((label) => phraseFor(label, input.seed))
    .filter((phrase): phrase is PhraseVariant => Boolean(phrase));

  const joinBody = (items: PhraseVariant[]): string => {
    if (items.length === 0) return "";
    return pickIndex(2, joinRng) === 1
      ? joinTwoBeats(items)
      : joinChained(items);
  };

  const lines = [opening];
  if (campaignFound) {
    if (phrases.length === 0) {
      lines.push(
        fillCampaignCopy(
          CAMPAIGN_ONLY[pickIndex(CAMPAIGN_ONLY.length, campaignRng)] ?? "",
        ),
      );
    } else if (phrases.length >= 3 || pickIndex(2, campaignRng) === 0) {
      lines.push(
        fillCampaignCopy(
          CAMPAIGN_ONLY[pickIndex(CAMPAIGN_ONLY.length, campaignRng)] ?? "",
        ),
      );
      const body = joinBody(phrases);
      if (body) lines.push(body);
    } else {
      const extra = joinChained(phrases);
      const lead = CAMPAIGN_LEAD[pickIndex(CAMPAIGN_LEAD.length, campaignRng)];
      if (lead && extra) lines.push(fillCampaignCopy(lead(extra)));
    }
  } else if (phrases.length > 0) {
    const body = joinBody(phrases);
    if (body) lines.push(body);
  }

  const comment = String(input.extraComment || "").trim();
  if (comment) lines.push(comment);
  return lines.filter(Boolean).join("\n");
}
