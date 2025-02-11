//returns a series by seriesId
import config from "../../config";

const { url, ttl, prefix, teamLabel } = config.datasources.seriesService;

export async function load({ seriesId, profile }, context) {
  const { agency, name } = profile;
  const params = `series/${agency}/${name}/${seriesId}`;
  //http://series-service.cisterne.svc.cloud.dbc.dk/api/v2/series/190101/bibdk21/work-of:870970-basis:21682713
  const res = (
    await context?.fetch(`${url}${params}`, { allowedErrorStatusCodes: [404] })
  ).body;
  if (res.status === 404) {
    return null;
  }

  return res.series;
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 48, // 48 hours
  },
};

export { teamLabel };
