import config from "../config";

const { url } = config.datasources.pseudonymizer;
/**
 * Pseudonymize an ID
 */
export async function load(id, context) {
  return (await context.fetch(`${url}/api/v1/tokens/${id}`))?.body;
}
