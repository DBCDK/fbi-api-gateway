import agencyresponse from "./openplatform_agency_response.json";

export async function load({ agencyid, accessToken }) {
  return agencyresponse.data;
}
