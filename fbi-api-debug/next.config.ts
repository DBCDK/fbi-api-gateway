import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  assetPrefix: "/next", // in a chrome extension the path must not begin with _, hence we change the name
};

export default nextConfig;
