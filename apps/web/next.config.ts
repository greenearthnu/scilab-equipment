import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@scilab/shared", "@scilab/db"],
};

export default nextConfig;
