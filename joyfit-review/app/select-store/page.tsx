import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { StorePicker } from "@/components/store/store-picker";
import { STORE_MASTER_SHEET_URL } from "@/lib/store-master";
import { fetchStoresRemote } from "@/lib/stores-remote";

export default async function SelectStorePage() {
  const stores = await fetchStoresRemote();

  return (
    <MemberPageShell>
      <StorePicker stores={stores} />
      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        店舗一覧は{" "}
        <a
          href={STORE_MASTER_SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[color:var(--joyfit-red)] underline-offset-2 hover:underline"
        >
          スプレッドシート
        </a>
        で管理しています。
      </p>
    </MemberPageShell>
  );
}
