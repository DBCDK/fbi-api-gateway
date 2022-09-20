import config from "../config";

const { url } = config.datasources.faustService;

export async function load({ faust, profile }, context) {
  const res = await context?.fetch(
    `${url}/api/v1/faust/lookup/work/${profile.agency}/${profile.name}/${faust}?trackingId=${context.trackingId}`
  );

  return (await res.json())?.persistentWorkId;
}
