export const mockDashboardMetrics = {
  averageRating: 4.4,
  totalReviews: 182,
  unrepliedReviews: 14,
};

export const mockRecentReviews = [
  {
    id: "r1",
    reviewerName: "Taro K",
    rating: 5,
    comment: "スタッフの対応が丁寧で、マシンも使いやすいです。",
    reviewedAt: "2026-03-22T10:30:00.000Z",
    replyStatus: "NONE",
  },
  {
    id: "r2",
    reviewerName: "Mika S",
    rating: 4,
    comment: "朝の時間帯は混雑が少なく、快適にトレーニングできます。",
    reviewedAt: "2026-03-21T08:12:00.000Z",
    replyStatus: "POSTED",
  },
  {
    id: "r3",
    reviewerName: "Kenji N",
    rating: 2,
    comment: "シャワールームの清潔感が少し気になりました。",
    reviewedAt: "2026-03-20T19:48:00.000Z",
    replyStatus: "NONE",
  },
] as const;
