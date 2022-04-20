module.exports = {
  reactStrictMode: true,
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  async redirects() {
    return [
      {
        source: "/:agency/:profile/graphql",
        destination: "/",
        permanent: false,
      },
      {
        source: "/:agency/:profile",
        destination: "/",
        permanent: false,
      },
    ];
  },
};
