//Reuturns ids for series and universes that the work is part of.

import config from "../../config";

const { url, ttl, prefix } = config.datasources.seriesService;
export async function load({ workId, profile }, context) {
  const { agency, name } = profile;
  const params = `${agency}/${name}/${workId}`;

  //ex: http://series-service.cisterne.svc.cloud.dbc.dk/api/v2/identify/190101/bibdk21/work-of:870970-basis:50897869
  const res = (
    await context?.fetch(`${url}identify/${params}`, {
      allowedErrorStatusCodes: [404],
    })
  ).body;
  if (res.status === 404) {
    return null;
  }
  //returns an object with series and universes {universes: [], series: [{"id": "1","title": "Tintins oplevelser"}]}
  return res;
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 48, // 48 hours
  },
};
