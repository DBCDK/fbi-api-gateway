const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.join(__dirname, "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      "@api-gateway": path.join(monorepoRoot, "src"),
    },
  },
  ...(process.env.NODE_ENV === "production"
    ? { outputFileTracingRoot: monorepoRoot }
    : {}),
  reactStrictMode: true,
  basePath: "/test",
  assetPrefix: "/test",
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@api-gateway": path.join(monorepoRoot, "src"),
    };
    return config;
  },
};

module.exports = nextConfig;
