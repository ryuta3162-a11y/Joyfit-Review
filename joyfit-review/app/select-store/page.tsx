import { MemberPageShell } from "@/components/joyfit/member-page-shell";
import { StorePicker } from "@/components/store/store-picker";
import { fetchStoresRemote } from "@/lib/stores-remote";

export default async function SelectStorePage() {
  const stores = await fetchStoresRemote();

  return (
    <MemberPageShell>
      <StorePicker stores={stores} />
    </MemberPageShell>
  );
}
