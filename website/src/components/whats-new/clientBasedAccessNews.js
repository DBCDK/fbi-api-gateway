const clientBasedAccessNews = {
  newsId: "client-based-access-v1",
  publishedAt: "2026-07-09",
  expiresAfterDays: 30,
  slides: [
    {
      eyebrow: "What's new?",
      icon: "✨",
      title: "What’s changed since the last update?",
      body: "We’ve added client-based access, more stable token handling, and a new settings menu for the documentation interface.",
    },
    {
      eyebrow: "Access",
      icon: "🔐",
      title: "Connect with client credentials",
      body: "Client secrets can now be attached to connected applications, so the documentation site can renew access tokens automatically.",
    },
    {
      eyebrow: "Settings",
      icon: "⚙️",
      title: "New settings menu",
      body: "Adjust how the documentation tools behave, including theme, query execution, network mode, and cleanup options.",
    },
    {
      eyebrow: "Newsletter",
      icon: "📬",
      title: "Stay updated",
      body: "Remember to subscribe for updates about schema changes, deprecations, and breaking changes in the FBI API. [Sign up here](http://eepurl.com/jlfdkE)",
    },
  ],
};

export default clientBasedAccessNews;
