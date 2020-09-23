export default {
  datasources: {
    moreinfo: {
      url: process.env.MOREINFO_URL,
      authenticationUser: process.env.MOREINFO_USER,
      authenticationGroup: process.env.MOREINFO_GROUP,
      authenticationPassword: process.env.MOREINFO_PASSWORD
    },
    work: {
      url:
        process.env.WORKSERVICE_URL ||
        "http://work-presentation-service.cisterne.svc.cloud.dbc.dk/api/work-presentation",
      agencyId: process.env.WORKSERVICE_AGENCY_ID || "190101",
      profile: process.env.WORKSERVICE_PROFILE || "opac"
    }
  }
};
