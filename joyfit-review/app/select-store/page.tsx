import { StorePicker } from "@/components/store/store-picker";
import { STORE_MASTER_SHEET_URL } from "@/lib/store-master";
import { fetchStoresRemote } from "@/lib/stores-remote";

export default async function SelectStorePage() {
  const stores = await fetchStoresRemote();

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8">
      <StorePicker stores={stores} />
      <p className="mx-auto mt-6 max-w-xl text-center text-xs text-muted-foreground">
        店舗マスタ管理:{" "}
        <a href={STORE_MASTER_SHEET_URL} target="_blank" rel="noopener noreferrer" className="underline">
          Googleスプレッドシート
        </a>
      </p>
    </div>
  );
}
