import config from "../config";

export async function load({ q, n }, context) {
  const url = config.datasources.relatedsubjects.url;
  let query = "?q=" + q;
  if (n) {
    query += "&n=" + n;
  }

  const result = await context.fetch(`${url}${query}`);
  return await result.json();
}
