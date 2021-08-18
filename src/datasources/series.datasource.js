import request from "superagent";
import config from "../config";

const { url, agencyId, profile, ttl, prefix } = config.datasources.series;

export async function load({ workId, trackingId = null }) {
  // trackingId can be added to the params by adding /${trackingId} to the end
  const params = `${agencyId}/${profile}/${workId}`;

  // series-service returns 404 if workId is not a part of a serie
  try {
    return (await request.get(`${url}/${params}`)).body;
  } catch (error) {
    // if error or not a part of a series (404)
    return null;
  }
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 7, // 7 days
  },
};
