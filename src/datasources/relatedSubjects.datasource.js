import config from "../config";

export async function load({ q, limit }, context) {
  const url = config.datasources.relatedsubjects.url;
  let query = "?q=" + q.join("&=");
  if (limit) {
    query += "&n=" + limit;
  }

  const result = await context.fetch(`${url}${query}`);
  return await result.json();
}
