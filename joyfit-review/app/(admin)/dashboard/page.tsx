import { Star } from "lucide-react";

import { DestinationLinkGenerator } from "@/components/admin/destination-link-generator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockDashboardMetrics, mockRecentReviews } from "@/lib/mock-data";

const reviewedAtFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DestinationLinkGenerator />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">ダッシュボード</h2>
        <p className="text-sm text-muted-foreground">
          Googleマップ口コミの獲得状況と返信対応状況を確認できます。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均評価</CardDescription>
            <CardTitle className="flex items-center gap-1 text-3xl">
              {mockDashboardMetrics.averageRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            直近30日のGoogleマップ評価平均
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>総口コミ数</CardDescription>
            <CardTitle className="text-3xl">{mockDashboardMetrics.totalReviews}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">全期間の投稿件数</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>未返信口コミ数</CardDescription>
            <CardTitle className="text-3xl">{mockDashboardMetrics.unrepliedReviews}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">スタッフ対応待ち</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最新の口コミ</CardTitle>
          <CardDescription>Google Business Profile API連携前のモックデータです。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>投稿者</TableHead>
                <TableHead>評価</TableHead>
                <TableHead>コメント</TableHead>
                <TableHead>投稿日時</TableHead>
                <TableHead>返信状況</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecentReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.reviewerName}</TableCell>
                  <TableCell>{review.rating} / 5</TableCell>
                  <TableCell className="max-w-sm truncate">{review.comment}</TableCell>
                  <TableCell>{reviewedAtFormatter.format(new Date(review.reviewedAt))}</TableCell>
                  <TableCell>
                    <Badge variant={review.replyStatus === "NONE" ? "destructive" : "secondary"}>
                      {review.replyStatus === "NONE" ? "未返信" : "返信済み"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
