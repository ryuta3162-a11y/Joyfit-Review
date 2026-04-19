import { Camera, Star } from "lucide-react";

type Props = {
  storeName: string;
};

/**
 * Google マップの口コミ画面に近い「操作イメージ」（非公式・実際の画面とは異なる場合があります）
 */
export function GoogleReviewMock({ storeName }: Props) {
  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      role="img"
      aria-label="口コミ投稿画面の操作イメージ。星はタップの例です。実際の評価はご自身でお選びください。"
    >
      <p className="text-center text-[15px] font-medium text-zinc-900">{storeName}</p>

      <div className="mt-4 flex items-start gap-3 border-b border-zinc-100 pb-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: "#1a73e8" }}
        >
          体
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-zinc-800">口コミ投稿画面の例</p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
            移動先では、星をタップしてから文章を貼り付け、「投稿」で完了です。
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-zinc-600">
        星は「タップの位置」の例です（実際の評価はご自身のご体験でお選びください）
      </p>
      <div className="mt-2 flex justify-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className="h-9 w-9 fill-[#fbbc04] text-[#fbbc04] sm:h-10 sm:w-10"
            strokeWidth={0}
          />
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-6 text-center text-xs leading-relaxed text-zinc-500">
        この場所での自分の体験や感想を共有しましょう
        <br />
        <span className="mt-1 inline-block text-[11px] text-zinc-400">（ここに下の文面を貼り付け）</span>
      </div>

      <div
        className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#1a73e8]"
        style={{ backgroundColor: "#e8f0fe" }}
      >
        <Camera className="size-4 shrink-0" aria-hidden />
        写真や動画を追加
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <span className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-[#1a73e8]">
          閉じる
        </span>
        <span
          className="rounded px-4 py-1.5 text-xs font-semibold text-white"
          style={{ backgroundColor: "#1a73e8" }}
        >
          投稿
        </span>
      </div>

      <p className="mt-3 text-center text-[10px] text-zinc-400">
        ※本枠は案内用のイラストです。Google の正式画面ではありません。
      </p>
    </div>
  );
}
