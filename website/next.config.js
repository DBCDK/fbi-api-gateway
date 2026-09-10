const path = require("path");

const redisEnabled = ["1", "true", "yes"].includes(
  String(process.env.REDIS_ENABLED).toLowerCase()
);
const defaultMaxClientEntries = redisEnabled ? 10 : 5;
const projectRoot = __dirname;
const monorepoRoot = path.join(__dirname, "..");
const whatsNewEnabled = process.env.NEXT_PUBLIC_WHATS_NEW_ENABLED;
const whatsNewPublishedAt = process.env.NEXT_PUBLIC_WHATS_NEW_PUBLISHED_AT;
const whatsNewExpiresAfterDays =
  process.env.NEXT_PUBLIC_WHATS_NEW_EXPIRES_AFTER_DAYS;

module.exports = {
  ...(process.env.NODE_ENV === "production"
    ? { outputFileTracingRoot: monorepoRoot }
    : {}),
  reactStrictMode: true,
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  env: {
    NEXT_PUBLIC_WEBSITE_THEME: process.env.WEBSITE_THEME || "default",
    NEXT_PUBLIC_MAX_CLIENT_ENTRIES:
      process.env.MAX_CLIENT_ENTRIES || String(defaultMaxClientEntries),
    NEXT_PUBLIC_WHATS_NEW_ENABLED: whatsNewEnabled || "",
    NEXT_PUBLIC_WHATS_NEW_PUBLISHED_AT: whatsNewPublishedAt || "",
    NEXT_PUBLIC_WHATS_NEW_EXPIRES_AFTER_DAYS: whatsNewExpiresAfterDays || "",
  },
  async redirects() {
    return [
      {
        source: "/775100/opac",
        destination: "/",
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@fbi-api": path.join(monorepoRoot, "src"),

      // The default imports used by Voyager GraphQL may cause errors. These can be resolved by overriding the import paths to point to the root directory.
      "graphql/execution": path.resolve(projectRoot, "node_modules/graphql"),
      "graphql/type": path.resolve(projectRoot, "node_modules/graphql"),
      "graphql/utilities": path.resolve(projectRoot, "node_modules/graphql"),
    };
    return config;
  },
};
