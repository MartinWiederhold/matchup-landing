import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build-Kennung (Commit-SHA) in den Client einbacken — für den Auto-Update-Check.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        pathname: "/rbzqg6pelgqa/**",
      },
      {
        protocol: "https",
        hostname: "dqeroewcdclgxujhubht.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Service Worker nie hart cachen, damit neue Versionen sofort erkannt werden.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
