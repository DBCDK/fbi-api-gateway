import config from "../config";

const { url, ttl, prefix } = config.datasources.catInspire;

export function restructureCategories(data) {
  const categories = {};
  if (data) {
    Object.entries(data).forEach(
      ([key, val]) =>
        (categories[key] = Object.entries(val).map(([title, result]) => ({
          title,
          result,
        })))
    );
  }

  return categories;
}

/**
 * Fetch smaug configuration
 */
export async function load({}, context) {
  const res = await context.fetch(url);
  const data = await res.json();

  return restructureCategories(data?.categories);
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 24, // 24 hours
  },
};
