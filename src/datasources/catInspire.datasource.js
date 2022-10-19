import config from "../config";

const { url, ttl, prefix } = config.datasources.catInspire;

/**
 * Fetch smaug configuration
 */
export async function load({}, context) {
  const res = await context.fetch(url);
  const data = await res.json();

  const categories = {};
  Object.entries(data.categories).forEach(
    ([key, val]) =>
      (categories[key] = Object.entries(val).map(([title, works]) => ({
        title,
        works,
      })))
  );

  return categories;
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 24 hours
  },
};
