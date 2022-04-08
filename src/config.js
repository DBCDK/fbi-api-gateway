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
  dmzproxy: {
    url: process.env.PROXY_URL || null,
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
    holdingstatus: {
      url:
        process.env.HOLDINGSTATUS_URL ||
        "https://openholdingstatus.addi.dk/3.1/",
      ttl: process.env.HOLDINGSTATUS_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.HOLDINGSTATUS_PREFIX || "holdingstatus-1",
    },
    holdingsitems: {
      url:
        process.env.HOLDINGSITEMS_URL ||
        "http://holdings-items-content-service.cisterne.svc.cloud.dbc.dk/api/holdings-by-branch/",
      ttl: process.env.HOLDINGSITEMS_URL_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.HOLDINGSITEMS_URL_PREFIX || "holdingsitems-1",
    },
    moreinfo: {
      url: process.env.MOREINFO_URL,
      authenticationUser: process.env.MOREINFO_USER,
      authenticationGroup: process.env.MOREINFO_GROUP,
      authenticationPassword: process.env.MOREINFO_PASSWORD,
      ttl: process.env.MOREINFO_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.MOREINFO_PREFIX || "moreinfo-2",
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
      ttl: process.env.WORKSERVICE_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.WORKSERVICE_PREFIX || "workservice-11",
    },
    series: {
      url:
        process.env.SERIES_URL ||
        "http://series-service.cisterne.svc.cloud.dbc.dk/api/v1/series-members",
      ttl: process.env.SERIES_TIME_TO_LIVE_SECONDS || 60 * 60,
      prefix: process.env.SERIES_PREFIX || "seriesservice-1",
    },
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || "6379",
      prefix: process.env.REDIS_PREFIX || "bibdk-api-4",
      enabled: process.env.REDIS_ENABLED || true,
    },
    simplesearch: {
      url:
        process.env.SIMPLESEARCH_URL ||
        "http://simple-search-bibdk-1-0.mi-prod.svc.cloud.dbc.dk/search",
      prefix: process.env.SIMPLESEARCH_PREFIX || "simplesearch-6",
      token: process.env.SIMPLESEARCH_TOKEN,
      ttl: process.env.SIMPLESEARCH_TIME_TO_LIVE_SECONDS || 10,
    },
    suggester: {
      url:
        process.env.SUGGESTER ||
        "http://simple-suggest-1-1.mi-prod.svc.cloud.dbc.dk/suggest",
      prefix: process.env.SUGGESTER_PREFIX || "suggester-1",
      token: process.env.SUGGESTER_TOKEN,
      ttl: process.env.SUGGESTER_TIME_TO_LIVE_SECONDS || 10,
    },
    facets: {
      url:
        process.env.FACETS_URL ||
        "http://simple-search-bibdk-1-0.mi-prod.svc.cloud.dbc.dk/facets",
      prefix: process.env.FACETS_PREFIX || "facets-1",
      token: process.env.FACETS_TOKEN,
      ttl: process.env.FACETS_TIME_TO_LIVE_SECONDS || 10,
    },
    openplatform: {
      url: process.env.OPENPLATFORM_URL || "https://openplatform.dbc.dk/v3",
      prefix: process.env.OPENPLATFORM_PREFIX || "openplatform-1",
      ttl: process.env.OPENFORMAT_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
    },
    vipcore: {
      excludeBranches:
        process.env.VIP_EXCLUDE_BRANCHES === "true" ||
        process.env.VIP_EXCLUDE_BRANCHES == "1",
      url:
        process.env.VIP_CORE_URL ||
        "http://vipcore.iscrum-vip-prod.svc.cloud.dbc.dk/1.0/api",
      prefix: process.env.VIP_CORE_PREFIX || "vipcore-1",
      ttl: process.env.VIP_CORE_TIME_TO_LIVE_SECONDS || 60 * 60 * 0.5,
    },
    idp: {
      url:
        process.env.IDP_URL ||
        "http://idpservice.iscrum-prod.svc.cloud.dbc.dk/api/v1",
      prefix: process.env.IDP_PREFIX || "IDP-2",
      ttl: process.env.VIP_CORE_TIME_TO_LIVE_SECONDS || 60 * 60 * 10,
    },
    smaug: {
      url: process.env.SMAUG_URL || "https://auth-config.dbc.dk",
    },
    statsbiblioteket: {
      url:
        process.env.STATSBIBLIOTEKET_URL ||
        "http://webservice.statsbiblioteket.dk",
      user: process.env.STATSBIBLIOTEKET_USER,
      password: process.env.STATSBIBLIOTEKET_PASSWORD,
    },
    recommendations: {
      url:
        process.env.RECOMMENDATIONS_URL ||
        "http://booklens-1-1.mi-prod.svc.cloud.dbc.dk",
      ttl: process.env.RECOMMENDATIONS_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.RECOMMENDATIONS_PREFIX || "recommendations-1",
    },
  },
};
