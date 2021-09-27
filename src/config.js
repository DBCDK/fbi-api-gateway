export default {
  app: {
    id: process.env.APP_ID || "bibliotekdk-next-api",
  },
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
    borchk: {
      url: process.env.BORCHK_URL || "https://borchk.addi.dk/2.5/",
    },
    moreinfo: {
      url: process.env.MOREINFO_URL,
      authenticationUser: process.env.MOREINFO_USER,
      authenticationGroup: process.env.MOREINFO_GROUP,
      authenticationPassword: process.env.MOREINFO_PASSWORD,
      ttl: process.env.MOREINFO_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.MOREINFO_PREFIX || "moreinfo-1",
    },
    openorder: {
      url: process.env.OPENORDER_URL,
      authenticationUser: process.env.OPENORDER_USER,
      authenticationGroup: process.env.OPENORDER_GROUP,
      authenticationPassword: process.env.OPENORDER_PASSWORD,
      serviceRequester: process.env.OPENORDER_SERVICEREQUESTER,
      ttl: process.env.OPENORDER_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.OPENORDER_PREFIX || "openorder-1",
    },
    work: {
      url:
        process.env.WORKSERVICE_URL ||
        "http://work-presentation-service.cisterne.svc.cloud.dbc.dk/api/work-presentation",
      agencyId: process.env.WORKSERVICE_AGENCY_ID || "190101",
      profile: process.env.WORKSERVICE_PROFILE || "default",
      ttl: process.env.WORKSERVICE_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.WORKSERVICE_PREFIX || "workservice-10",
    },
    series: {
      url:
        process.env.SERIES_URL ||
        "http://series-service.cisterne.svc.cloud.dbc.dk/api/v1/series-members",
      agencyId: process.env.SERIES_AGENCY_ID || "190101",
      profile: process.env.SERIES_PROFILE || "default",
      ttl: process.env.SERIES_TIME_TO_LIVE_SECONDS || 60 * 60,
      prefix: process.env.SERIES_PREFIX || "seriesservice-1",
    },
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || "6379",
      prefix: process.env.REDIS_PREFIX || "bibdk-api-3",
      enabled: process.env.REDIS_ENABLED || true,
    },
    simplesearch: {
      url:
        process.env.SIMPLESEARCH_URL ||
        "http://simple-search-bibdk-1-0.mi-prod.svc.cloud.dbc.dk/search",
      prefix: process.env.SIMPLESEARCH_PREFIX || "simplesearch-2",
    },
    openplatform: {
      url: process.env.OPENPLATFORM_URL || "https://openplatform.dbc.dk/v3",
      prefix: process.env.OPENPLATFORM_PREFIX || "openplatform-1",
      ttl: process.env.OPENFORMAT_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
    },
    vipcore: {
      url:
        process.env.VIP_CORE_URL ||
        "http://vipcore.iscrum-vip-prod.svc.cloud.dbc.dk/1.0/api",
      prefix: process.env.VIP_CORE_PREFIX || "vipcore-1",
      ttl: process.env.VIP_CORE_TIME_TO_LIVE_SECONDS || 60 * 60 * 0.5,
    },
    smaug: {
      url: process.env.SMAUG_URL || "https://auth-config.dbc.dk",
    },
    statsbiblioteket: {
      url:
        process.env.STATSBIBLIOTEKET_URL ||
        "https://webservice.statsbiblioteket.dk",
    },
  },
};
