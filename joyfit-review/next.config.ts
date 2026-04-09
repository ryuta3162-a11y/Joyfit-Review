import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // OneDrive 上の日本語パスで Turbopack が panic するため dev は package.json で --webpack を使用。
  // ルート推定の警告を抑える（npm run dev は joyfit-review 直下で実行すること）。
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
