import config from "../../config";

const { url, ttl, prefix } = config.datasources.seriesService;
//reuturns ids for series and universes that the work is part of.
export async function load({ workId, trackingId = null, profile }, context) {
  const { agency, name } = profile;
  // trackingId can be added to the params by adding /${trackingId} to the end
  const params = `${agency}/${name}/${workId}`;
  console.log(
    `\n\n\n\n\n IN SERIES IDENTIFY!!!! URL!! ${url}identify/${params}\n\n\n`
  );
  //http://series-service.cisterne.svc.cloud.dbc.dk/api/v2/identify/190101/bibdk21/work-of:870970-basis:50897869
  const res = (
    await context?.fetch(`${url}identify/${params}`, {
      allowedErrorStatusCodes: [404],
    })
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