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
    `${url}?workId=${workId}&agencyId=${profile.agency}=&profile=${profile.name}&includeRelations=true`
  );

  return (await res.json())?.work;
}

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
export async function batchLoader(keys, context) {
  console.log("get", keys);
  return await Promise.all(
    keys.map(async (key) => {
      try {
        console.log("hep", key, context);
        return await load(key, context);
      } catch (e) {
        console.log("whatt", e);
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

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export async function status() {
  await load(
    {
      workId: "work-of:870970-basis:51877330",
      profile: { agency: "190101", name: "default" },
    },
    { fetch }
  );
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 48, // 48 hours
  },
};
