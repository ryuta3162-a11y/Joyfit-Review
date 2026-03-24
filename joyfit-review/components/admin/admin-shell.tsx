import Link from "next/link";
import { Building2, LayoutDashboard, MessageSquareText, Settings } from "lucide-react";

type AdminShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/reviews", label: "口コミ管理", icon: MessageSquareText },
  { href: "/settings", label: "設定", icon: Settings },
] as const;

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-r bg-background px-4 py-6">
          <div className="mb-8 flex items-center gap-2 px-2">
            <Building2 className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold leading-none">JOYFIT Review</p>
              <p className="text-xs text-muted-foreground">店舗管理画面</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div>
              <h1 className="text-sm font-medium text-muted-foreground">JOYFIT 〇〇店</h1>
            </div>
            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              r-kusaka@okamoto-group.co.jp
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </section>
      </div>
    </div>
  );
}
