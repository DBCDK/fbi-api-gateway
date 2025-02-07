import config from "../config";

const { url , teamLabel } = config.datasources.pseudonymizer;
/**
 * Pseudonymize an ID
 */
export async function load(id, context) {
  return (
    await context.fetch(`${url}/api/v1/tokens/${id}`, {
      allowedErrorStatusCodes: [409],
    })
  )?.body;
}
