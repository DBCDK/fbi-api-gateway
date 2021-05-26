export default {
  port: process.env.PORT || 3000,
  query: {
    maxComplexity: process.env.MAX_QUERY_COMPLEXITY
      ? parseInt(process.env.MAX_QUERY_COMPLEXITY, 10)
      : 100000,
  },
  datasources: {
    openformat: {
      url:
        process.env.OPENFORMAT_URL ||
        "http://openformat-php-master.frontend-staging.svc.cloud.dbc.dk/server.php",
      ttl: process.env.OPENFORMAT_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.OPENFORMAT_PREFIX || "openformat-1",
    },
    backend: {
      url:
        process.env.BACKEND_URL ||
        "http://bibdk-backend-www-master.frontend-prod.svc.cloud.dbc.dk/graphql",
      ttl: process.env.BACKEND_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.BACKEND_PREFIX || "backend-1",
    },
    moreinfo: {
      url: process.env.MOREINFO_URL,
      authenticationUser: process.env.MOREINFO_USER,
      authenticationGroup: process.env.MOREINFO_GROUP,
      authenticationPassword: process.env.MOREINFO_PASSWORD,
      ttl: process.env.MOREINFO_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.MOREINFO_PREFIX || "moreinfo-1",
    },
    work: {
      url:
        process.env.WORKSERVICE_URL ||
        "http://work-presentation-service.cisterne.svc.cloud.dbc.dk/api/work-presentation",
      agencyId: process.env.WORKSERVICE_AGENCY_ID || "190101",
      profile: process.env.WORKSERVICE_PROFILE || "default",
      ttl: process.env.WORKSERVICE_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.WORKSERVICE_PREFIX || "workservice-1",
    },
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || "6379",
      prefix: process.env.REDIS_PREFIX || "bibdk-api-2",
      enabled: process.env.REDIS_ENABLED || true,
    },
    simplesearch: {
      url:
        process.env.SIMPLESEARCH_URL ||
        "http://wp-simple-search.os-externals.svc.cloud.dbc.dk/search",
      prefix: process.env.SIMPLESEARCH_PREFIX || "simplesearch-1",
    },
    openplatform: {
      url: process.env.OPENPLATFORM_URL || "https://openplatform.dbc.dk/v3",
      prefix: process.env.OPENPLATFORM_PREFIX || "openplatform-1",
      ttl: process.env.OPENFORMAT_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
    },
  },
};
