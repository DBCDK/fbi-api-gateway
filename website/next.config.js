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
};
