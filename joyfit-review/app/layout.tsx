import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "アンケートページ | JOYFIT / FIT365",
  description: "JOYFIT / FIT365 各店舗のアンケート・クチコミご協力ページです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
