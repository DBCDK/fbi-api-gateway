import config from "../config";

const {teamLabel} =config.datasources.relatedsubjects;


export async function load({ q, limit }, context) {
  const url = config.datasources.relatedsubjects.url;
  let query = "?q=" + q.join("&q=");

  if (limit) {
    query += "&n=" + limit;
  }

  const result = await context.fetch(`${url}${query}`);
  return result.body;
}
