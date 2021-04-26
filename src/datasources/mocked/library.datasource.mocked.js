import agencyresponse from "./openplatform_agency_response.json";
export default {
  load: (agencyid) => {
    return agencyresponse.data;
  },
};
