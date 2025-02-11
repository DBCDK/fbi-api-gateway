import config from "../config";

const { url, teamLabel } = config.datasources.faustService;

export async function load({ faust, profile }, context) {
  const res = await context?.fetch(
    `${url}/api/v1/faust/lookup/manifestation/${profile.agency}/${profile.name}/${faust}?trackingId=${context.trackingId}`,
    { allowedErrorStatusCodes: [404] }
  );

  return res?.body?.manifestationsId;
}

export { teamLabel };
