import config from "../config";

const { url, ttl, prefix } = config.datasources.seriesService;

export async function load(
  { universeId, trackingId = null, profile },
  context
) {
  const { agency, name } = profile;
  // trackingId can be added to the params by adding /${trackingId} to the end
  const params = `universes/${agency}/${name}/${universeId}`;
  console.log(`\n\n\n\n\n${url}${params}\n\n\n`);
  //http://series-service.cisterne.svc.cloud.dbc.dk/api/v2/series/190101/bibdk21/work-of:870970-basis:21682713
  const res = (
    await context?.fetch(`${url}${params}`, { allowedErrorStatusCodes: [404] })
  ).body;
  if (res.status === 404) {
    return null;
  }

  return res.universe;
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 48, // 48 hours
  },
};
