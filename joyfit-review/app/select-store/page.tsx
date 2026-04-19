import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { StorePicker } from "@/components/store/store-picker";
import { STORE_MASTER_SHEET_URL } from "@/lib/store-master";
import { fetchStoresRemote } from "@/lib/stores-remote";

export default async function SelectStorePage() {
  const stores = await fetchStoresRemote();

  return (
    <MemberPageShell>
      <StorePicker stores={stores} />
      <p className="mt-6 text-center text-[11px] text-white/80">
        店舗マスタは運用担当が{" "}
        <a
          href={STORE_MASTER_SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-white underline decoration-white/50 underline-offset-2 hover:decoration-white"
        >
          Googleスプレッドシート
        </a>
        で更新し、公開サイトには反映されます。
      </p>
    </MemberPageShell>
  );
}
