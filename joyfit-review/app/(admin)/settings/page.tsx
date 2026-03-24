import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>設定</CardTitle>
        <CardDescription>店舗ごとのGoogleレビューURLとAIプロンプトを管理する画面です。</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Step2ではモック画面を作成。フォーム実装は次ステップで追加します。
      </CardContent>
    </Card>
  );
}
