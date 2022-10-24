module.exports = {
  reactStrictMode: true,
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  publicRuntimeConfig: {
    isChristmas: process.env.WEBSITE_THEME === "christmas",
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
};
