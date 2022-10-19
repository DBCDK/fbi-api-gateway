import config from "../config";

/**
 * Fetch smaug configuration
 */
export async function load({}, context) {
  return "hest datasource";
  const res = await context.fetch(
    `${config.datasources.catInspire.url}/configuration?token=${accessToken}`
  );
  return await res.json();
}
