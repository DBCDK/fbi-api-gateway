const path = require("path");

const redisEnabled = ["1", "true", "yes"].includes(
  String(process.env.REDIS_ENABLED).toLowerCase()
);
const defaultMaxClientEntries = redisEnabled ? 10 : 5;

module.exports = {
  reactStrictMode: true,
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  publicRuntimeConfig: {
    theme: process.env.WEBSITE_THEME || "default",
    maxClientEntries:
      process.env.MAX_CLIENT_ENTRIES || String(defaultMaxClientEntries),
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

      // The default imports used by Voyager GraphQL may cause errors. These can be resolved by overriding the import paths to point to the root directory.
      "graphql/execution": path.resolve(__dirname, "node_modules/graphql"),
      "graphql/type": path.resolve(__dirname, "node_modules/graphql"),
      "graphql/utilities": path.resolve(__dirname, "node_modules/graphql"),
    };
    return config;
  },
};
