import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>口コミ管理</CardTitle>
        <CardDescription>
          Step2では管理画面レイアウトのみ実装。Step3以降で一覧・AI返信モーダルを追加します。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Googleマップの口コミ一覧、未返信フィルタ、返信投稿機能をここに実装予定です。
      </CardContent>
    </Card>
  );
}
