export type StoreMasterRow = {
  id: string;
  name: string;
  searchText: string;
  googleReviewUrl: string;
  /** 星3以下のフィードバック送信先（カンマ区切りで複数可） */
  feedbackEmail: string;
  /** 店舗住所（任意） */
  address?: string;
  /** 店舗緯度（任意） */
  latitude?: number;
  /** 店舗経度（任意） */
  longitude?: number;
};

/** GAS未設定・取得失敗時に使うバックアップ */
export const STORES_FALLBACK: StoreMasterRow[] = [
  {
    id: "kyodo",
    name: "JOYFIT24経堂",
    searchText: "経堂 きょうどう キョウドウ kyodo joyfit24 ジョイフィット",
    googleReviewUrl: "https://g.page/r/Cdo92khF2w03EAE/review",
    feedbackEmail: "",
  },
];

export const STORE_MASTER_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/13_E8m3vQa_61hcoMAPb7XZTyVDVtQ9O7rkVDNtHQvRM/edit?gid=0#gid=0";
