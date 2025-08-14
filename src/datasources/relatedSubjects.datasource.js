import config from "../config";

const { teamLabel } = config.datasources.relatedsubjects;

export async function load({ q, limit }, context) {
  const url = config.datasources.relatedsubjects.url;
  let query = "?q=" + q.join("&q=");

  if (limit) {
    query += "&n=" + limit;
  }

  console.log('\n\n\n\n IN relatedsubjects : url: ',url,'\n\n\n\n')
  console.log('\n\n\n\n IN relatedsubjects : query: ',query,'\n\n\n\n')
  const result = await context.fetch(`${url}${query}`);
  return result.body;
}

export { teamLabel };
