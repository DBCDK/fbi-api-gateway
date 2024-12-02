/**
 * @file This datasource is used to retrieve a marc record by id
 */

import config from "../../config";

const { url, ttl, prefix } = config.datasources.marc;

/**
 * Gets the MARC record by the gievn id
 */
export async function load({ recordId }, context) {
  const res = await context?.fetch(
    `${url}/records/${recordId}?serializationFormat=marcXchange`,
    {
      allowedErrorStatusCodes: [404],
    }
  );

  if (res.status === 200) {
    return res.body;
  }

  return null;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
