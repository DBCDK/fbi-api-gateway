import agencyresponse from "./openplatform_agency_response.json";
import allagenciesresponse from "./openplatform_all_agencies_response.json";

export async function load({ agencyid, accessToken }) {
  if (agencyid) {
    return agencyresponse.data;
  } else {
    return allagenciesresponse.data;
  }
}
