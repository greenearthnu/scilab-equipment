import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@scilab/shared", "@scilab/db"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
