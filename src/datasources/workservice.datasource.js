import config from "../config";
import fetch from "isomorphic-unfetch";

const { url, ttl, prefix } = config.datasources.work;

/**
 * Fetches a work from the work service
 * @param {Object} params
 * @param {string} params.workId id of the work
 */
export async function load({ workId, profile }, context) {
  const res = await context?.fetch(
    `${url}?workId=${workId}&agencyId=${profile.agency}=&profile=${profile.name}&includeRelations=true`,
    { allowedErrorStatusCodes: [403, 404] }
  );

  return res?.body?.work;
}

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
export async function batchLoader(keys, context) {
  return await Promise.all(
    keys.map(async (key) => {
      try {
        return await load(key, context);
      } catch (e) {
        // We return error instead of throwing,
        // se we don't fail entire Promise.all
        // DataLoader will make sure its thrown in a resolver
        // if (e.status !== 404) {
        //   return e;
        // }
        return null;
      }
    })
  );
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 48, // 48 hours
  },
};
