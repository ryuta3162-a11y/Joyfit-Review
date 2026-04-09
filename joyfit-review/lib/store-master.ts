export type StoreMasterRow = {
  id: string;
  name: string;
  searchText: string;
  googleReviewUrl: string;
};

/** GAS未設定・取得失敗時に使うバックアップ */
export const STORES_FALLBACK: StoreMasterRow[] = [
  {
    id: "kyodo",
    name: "JOYFIT24経堂",
    searchText: "経堂 きょうどう キョウドウ kyodo joyfit24 ジョイフィット",
    googleReviewUrl: "https://g.page/r/Cdo92khF2w03EAE/review",
  },
];

export const STORE_MASTER_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/13_E8m3vQa_61hcoMAPb7XZTyVDVtQ9O7rkVDNtHQvRM/edit?gid=0#gid=0";
