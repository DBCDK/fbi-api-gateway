import config from "../config";

const { url, ttl, prefix } = config.datasources.series;

export async function load({ workId, trackingId = null, profile }, context) {
  const { agency, name } = profile;
  // trackingId can be added to the params by adding /${trackingId} to the end
  const params = `${agency}/${name}/${workId}`;

  // series-service returns 404 if workId is not a part of a serie
  const res = (
    await context?.fetch(`${url}/${params}`, { allowedErrorStatusCodes: [404] })
  ).body;
  if (res.status === 404) {
    return null;
  }

  return res;
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 48, // 48 hours
  },
};
