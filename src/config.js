export default {
  port: process.env.PORT || 3000,
  datasources: {
    openformat: {
      url:
        process.env.OPENFORMAT_URL ||
        "http://openformat-php-master.frontend-prod.svc.cloud.dbc.dk/server.php",
      ttl: process.env.OPENFORMAT_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.OPENFORMAT_PREFIX || "openformat-1"
    },
    moreinfo: {
      url: process.env.MOREINFO_URL,
      authenticationUser: process.env.MOREINFO_USER,
      authenticationGroup: process.env.MOREINFO_GROUP,
      authenticationPassword: process.env.MOREINFO_PASSWORD,
      ttl: process.env.MOREINFO_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.MOREINFO_PREFIX || "moreinfo-1"
    },
    work: {
      url:
        process.env.WORKSERVICE_URL ||
        "http://work-presentation-service.cisterne.svc.cloud.dbc.dk/api/work-presentation",
      agencyId: process.env.WORKSERVICE_AGENCY_ID || "190101",
      profile: process.env.WORKSERVICE_PROFILE || "opac",
      ttl: process.env.WORKSERVICE_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.WORKSERVICE_PREFIX || "workservice-1"
    },
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || "6379",
      prefix: process.env.REDIS_PREFIX || "bibdk-api-1",
      enabled: process.env.REDIS_ENABLED || true
    }
  }
};
