const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.join(__dirname, "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === "production"
    ? { outputFileTracingRoot: monorepoRoot }
    : {}),
  reactStrictMode: true,
  basePath: "/test",
  assetPrefix: "/test",
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@fbi-api": path.join(monorepoRoot, "src"),
    };
    return config;
  },
};

module.exports = nextConfig;
