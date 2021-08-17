import request from "superagent";
import config from "../config";

export async function load({ workId, trackingId = null }) {
  const url = config.datasources.series.url;
  const agencyId = config.datasources.series.agencyId;
  const profile = config.datasources.series.profile;

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
