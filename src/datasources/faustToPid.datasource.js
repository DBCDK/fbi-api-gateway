/**
 * @file Mapping faust to manifestation id
 */

import config from "../config";

const { url } = config.datasources.faustService;

export async function load({ faust, profile }, context) {
  const res = await context?.fetch(
    `${url}/api/v1/faust/lookup/manifestation/${profile.agency}/${profile.name}/${faust}?trackingId=${context.trackingId}`
  );

  return (await res.json())?.manifestationsId;
}
