import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        pathname: "/rbzqg6pelgqa/**",
      },
    ],
  },
};

export default nextConfig;
