const path = require("path");

module.exports = {
  reactStrictMode: true,
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  publicRuntimeConfig: {
    theme: process.env.WEBSITE_THEME || "default",
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
