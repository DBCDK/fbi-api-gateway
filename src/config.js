export default {
  app: {
    id: process.env.APP_ID || "bibliotekdk-next-api",
  },
  port: process.env.PORT || 3000,
  query: {
    maxDepth: process.env.MAX_QUERY_DEPTH
      ? parseInt(process.env.MAX_QUERY_DEPTH, 10)
      : 15,
    maxComplexity: process.env.MAX_QUERY_COMPLEXITY
      ? parseInt(process.env.MAX_QUERY_COMPLEXITY, 10)
      : 1000,
  },
  dmzproxy: {
    url: process.env.PROXY_URL || null,
  },
  // How many outgoing HTTP requests a single incoming request can make in parallel
  fetchConcurrencyLimit: process.env.FETCH_CONCURRENCY_LIMIT || 10,
  fetchDefaultTimeoutMs: process.env.FETCH_DEFAULT_TIMEOUT_MS || 20000,
  datasources: {
    ocn2pid: {
      url:
        process.env.OCN_TO_PID_URL ||
        "http://ocn2pid.addi.dk/ocn2pid/ocn-collection/",
    },
    didyoumean: {
      url:
        process.env.DID_YOU_MEAN_URL ||
        "http://did-you-mean-1-0.mi-prod.svc.cloud.dbc.dk",
    },
    catInspire: {
      url:
        process.env.CAT_INSPIRE_URL ||
        "http://cat-inspire-1-0.mi-prod.svc.cloud.dbc.dk",
      ttl: process.env.CAT_INSPIRE_TIME_TO_LIVE_SECONDS || 60,
      prefix: process.env.CAT_INSPIRE_PREFIX || "cat-inspire-1",
    },
    complexsearch: {
      url:
        process.env.COMPLEX_SEARCH_URL ||
        "http://cql-parser.complex-search-prod.svc.cloud.dbc.dk/api/v1",
      ttl: process.env.COMPLEX_SEARCH_TIME_TO_LIVE_SECONDS || 60,
      prefix: process.env.COMPLEX_SEARCH_PREFIX || "complexsearch-1",
    },
    complexFacets: {
      url:
        process.env.COMPLEX_FACETS_URL ||
        "http://cql-parser.complex-search-prod.svc.cloud.dbc.dk/api/v1/variants",
      ttl: process.env.COMPLEX_FACETS_TIME_TO_LIVE_SECONDS || 60 * 60,
      prefix: process.env.COMPLEX_FACETS_PREFIX || "complexsearch-1",
    },
    defaultforsider: {
      url:
        process.env.DEFAULTFORSIDER_URL ||
        "http://default-forsider.febib-staging.svc.cloud.dbc.dk/",
      ttl: process.env.DEFAULTFORSIDER_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.DEFAULTFORSIDER_PREFIX || "defaultforsider-2",
      secret: process.env.DEFAULTFORSIDER_KEY || "somesecret",
    },
    relatedsubjects: {
      url:
        process.env.RELATED_SUBJECTS ||
        "http://query-related-subject-1-0.mi-prod.svc.cloud.dbc.dk/",
    },
    faustService: {
      url:
        process.env.FAUST_SERVICE_URL ||
        "http://faust-resolver-service.cisterne.svc.cloud.dbc.dk",
    },
    jed: {
      url:
        process.env.JED_URL ||
        "http://jed-presentation-1-2-service.cisterne.svc.cloud.dbc.dk",
      ttl: process.env.JED_TIME_TO_LIVE_SECONDS || 60 * 10,
      prefix: process.env.JED_PREFIX || "jed-2",
    },
    openformat: {
      url:
        process.env.OPENFORMAT_URL ||
        "http://open-format-broker.cisterne.svc.cloud.dbc.dk/api/v2/format",
      ttl: process.env.OPENFORMAT_TIME_TO_LIVE_SECONDS || 60 * 60 * 24,
      prefix: process.env.OPENFORMAT_PREFIX || "openformat-1",
    },
    backend: {
      url:
        process.env.BACKEND_URL ||
        "http://bibdk-backend-www-master.febib-prod.svc.cloud.dbc.dk/graphql",
      ttl: process.env.BACKEND_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.BACKEND_PREFIX || "backend-1",
    },
    borchk: {
      url: process.env.BORCHK_URL || "https://borchk.addi.dk/3.1/",
      prefix: process.env.BORCHK_PREFIX || "borchk-1",
      ttl: process.env.BORCHK_TIME_TO_LIVE_SECONDS || 60 * 5,
      ffuIsBlocked: process.env.BORCHK_FFU_BLOCKED || false,
    },
    holdingsservice: {
      url:
        process.env.HOLDINGSSERVICE_URL ||
        "http://holdings-service.cisterne.svc.cloud.dbc.dk/api/v1/holdings-status/",
      ttl: process.env.HOLDINGSSERVICE_URL_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.HOLDINGSITEMS_URL_PREFIX || "holdingsservice-1",
    },
    holdingsitems: {
      url:
        process.env.HOLDINGSITEMS_URL ||
        "http://holdings-items-content-service.cisterne.svc.cloud.dbc.dk/api/holdings-by-branch/",
      ttl: process.env.HOLDINGSITEMS_URL_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.HOLDINGSITEMS_URL_PREFIX || "holdingsitems-1",
    },
    holdingsitemsForAgency: {
      url:
        process.env.HOLDINGSITEMS_FOR_AGENCY_URL ||
        "http://holdings-items-content-service.cisterne.svc.cloud.dbc.dk/api/holdings-by-pid/",
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
    openuserstatus: {
      url:
        process.env.OPENUSERSTATUS_URL || "https://openuserstatus.addi.dk/2.0/",
    },
    openorder: {
      url:
        process.env.OPENORDER_URL ||
        "http://copa-rs.iscrum-ors-staging.svc.cloud.dbc.dk/copa-rs/api/v1/",
      authenticationUser: process.env.OPENORDER_USER,
      authenticationGroup: process.env.OPENORDER_GROUP,
      authenticationPassword: process.env.OPENORDER_PASSWORD,
      serviceRequester: process.env.OPENORDER_SERVICEREQUESTER,
      ttl: process.env.OPENORDER_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.OPENORDER_PREFIX || "openorder-1",
    },
    series: {
      url:
        process.env.SERIES_URL ||
        "http://series-service.cisterne.svc.cloud.dbc.dk/api/v2/series-members",
      ttl: process.env.SERIES_TIME_TO_LIVE_SECONDS || 60 * 60,
      prefix: process.env.SERIES_PREFIX || "seriesservice-2",
    },
    universe: {
      url:
        process.env.UNIVERSES_URL ||
        "http://series-service.cisterne.svc.cloud.dbc.dk/api/v2/universe-members",
      ttl: process.env.UNIVERSES_TIME_TO_LIVE_SECONDS || 60 * 60,
      prefix: process.env.UNIVERSES_PREFIX || "seriesservice-universes-2",
    },
    seriesService: {
      url:
        process.env.SERIES_SERVICE_URL ||
        "http://series-service.cisterne.svc.cloud.dbc.dk/api/v2/",
      ttl: process.env.SERIES_TIME_TO_LIVE_SECONDS || 60 * 60,
      prefix: process.env.SERIES_PREFIX || "seriesservice-2",
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
        "http://simple-search-fbiapi-1-4.mi-prod.svc.cloud.dbc.dk/search",
      prefix: process.env.SIMPLESEARCH_PREFIX || "simplesearch-6",
      token: process.env.SIMPLESEARCH_TOKEN,
      ttl: process.env.SIMPLESEARCH_TIME_TO_LIVE_SECONDS || 10,
    },
    prosper: {
      url:
        process.env.PROSPER_URL ||
        "http://prosper-1-0.mi-prod.svc.cloud.dbc.dk/suggest",
      prefix: process.env.PROSPER_PREFIX || "prosper-1",
      token: process.env.SUGGESTER_TOKEN,
      ttl: process.env.PROSPER_TIME_TO_LIVE_SECONDS || 10,
    },
    complexsearchsuggest: {
      url:
        process.env.CS_SUGGEST_URL ||
        "http://cs-suggest.cisterne.svc.cloud.dbc.dk/api/v1/suggestions",
      prefix: process.env.CS_SUGGEST_PREFIX || "complexsearch-1",
      ttl: process.env.CS_SUGGEST_TIME_TO_LIVE_SECONDS || 10,
    },
    suggester: {
      url:
        process.env.SUGGESTER_URL ||
        "http://simple-suggest-1-1.mi-prod.svc.cloud.dbc.dk/suggest",
      prefix: process.env.SUGGESTER_PREFIX || "suggester-1",
      token: process.env.SUGGESTER_TOKEN,
      ttl: process.env.SUGGESTER_TIME_TO_LIVE_SECONDS || 10,
    },
    moodmatchkids: {
      url:
        process.env.MOODMATCH_KIDS_URL ||
        "http://mood-match-kids-search-1-0.mi-prod.svc.cloud.dbc.dk/",
      prefix: process.env.MOODMATCH_KIDS_PREFIX || "moodmatchkids-1",
      token: process.env.MOODMATCH_KIDS_TOKEN,
      ttl: process.env.MOODMATCH_KIDS_TIME_TO_LIVE_SECONDS || 60 * 60 * 0.5,
    },
    moodmatch: {
      url:
        process.env.MOODMATCH_URL ||
        "http://mood-match-search-1-0.mi-prod.svc.cloud.dbc.dk/",
      prefix: process.env.MOODMATCH_PREFIX || "moodmatch-1",
      token: process.env.MOODMATCH_TOKEN,
      ttl: process.env.MOODMATCH_TIME_TO_LIVE_SECONDS || 60 * 60 * 0.5,
    },
    moodrecommend: {
      url:
        process.env.MOODRECOMMEND_URL ||
        "http://mood-match-recommender-1-0.mi-prod.svc.cloud.dbc.dk/",
      prefix: process.env.MOODRECOMMEND_PREFIX || "moodrecommend-1",
      token: process.env.MOODRECOMMEND_TOKEN,
      ttl: process.env.MOODRECOMMEND_TIME_TO_LIVE_SECONDS || 60 * 60 * 0.5,
    },
    moodkidsrecommend: {
      url:
        process.env.MOODKIDSRECOMMEND_URL ||
        "http://mood-match-kids-recommender-1-0.mi-prod.svc.cloud.dbc.dk/",
      prefix: process.env.MOODKIDSRECOMMEND_PREFIX || "moodkidsrecommend-1",
      token: process.env.MOODKIDSRECOMMEND_TOKEN,
      ttl: process.env.MOODKIDSRECOMMEND_TIME_TO_LIVE_SECONDS || 60 * 60 * 0.5,
    },
    facets: {
      url:
        process.env.FACETS_URL ||
        "http://simple-search-fbiapi-1-4.mi-prod.svc.cloud.dbc.dk/facets",
      prefix: process.env.FACETS_PREFIX || "facets-1",
      token: process.env.FACETS_TOKEN,
      ttl: process.env.FACETS_TIME_TO_LIVE_SECONDS || 10,
      firstHits: process.env.FACETS_FIRST_HITS || 500,
      disableFuzzySearch:
        process.env.FACETS_DISABLE_FUZZY_SEARCH === "false" ? false : true,
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
        "http://idpservice.fbiscrum-prod.svc.cloud.dbc.dk/api/v1",
      prefix: process.env.IDP_PREFIX || "IDP-2",
      ttl: process.env.VIP_CORE_TIME_TO_LIVE_SECONDS || 60 * 60 * 10,
    },
    smaug: {
      url: process.env.SMAUG_URL || "https://auth-config.dbc.dk",
    },
    culr: {
      url:
        process.env.CULR_URL ||
        "http://culrservice-1-7.iscrum-culr-prod.svc.cloud.dbc.dk/1.7/api",
      soap_url:
        process.env.CULR_SOAP_URL ||
        "https://culr.addi.dk/1.6/CulrWebService?wsdl", // soap version of culr will be removed in future
      authenticationUser: process.env.CULR_USER,
      authenticationGroup: process.env.CULR_GROUP,
      authenticationPassword: process.env.CULR_PASSWORD,
    },
    statsbiblioteket: {
      url:
        process.env.STATSBIBLIOTEKET_URL ||
        "https://webservice.statsbiblioteket.dk",
      user: process.env.STATSBIBLIOTEKET_USER,
      password: process.env.STATSBIBLIOTEKET_PASSWORD,
      enabled: process.env.STATSBIBLIOTEKET_ENABLED || false,
    },
    recommendations: {
      url:
        process.env.RECOMMENDATIONS_URL ||
        "http://booklens-1-1.mi-prod.svc.cloud.dbc.dk",
      ttl: process.env.RECOMMENDATIONS_TIME_TO_LIVE_SECONDS || 5,
      prefix: process.env.RECOMMENDATIONS_PREFIX || "recommendations-1",
    },
    elk: {
      url:
        process.env.ELK_URL ||
        "https://elk.dbc.dk:9100/k8s-frontend-prod-*/_search",
      user: process.env.ELK_USER,
      password: process.env.ELK_PASSWORD,
      prefix: process.env.ELK_PREFIX || "elk-1",
    },
    infomedia: {
      url:
        process.env.INFOMEDIA_URL ||
        "http://infomedia-master.frontend-prod.svc.cloud.dbc.dk/1.4/server.php",
      id: process.env.INFOMEDIA_ID,
      ttl: process.env.INFOMEDIA_TIME_TO_LIVE_SECONDS || 60 * 60,
      prefix: process.env.INFOMEDIA_PREFIX || "infomedia-1",
    },
    linkcheck: {
      url:
        process.env.LINKCHECK_URL ||
        "http://link-check-service.de-prod.svc.cloud.dbc.dk/api/v1",
      prefix: process.env.LINKCHECK_PREFIX || "linkcheck-1",
      ttl: process.env.LINKCHECK_TIME_TO_LIVE_SECONDS || 60 * 60,
    },
    userInfo: {
      url: process.env.USER_INFO_URL || "https://stg.login.bib.dk/userinfo",
      prefix: "userinfo",
      ttl: 60 * 5,
    },
    userdata: {
      url:
        process.env.USERDATA_URL ||
        "http://bibliotekdk-next-userdata-stg.febib-staging.svc.cloud.dbc.dk/",
      ttl: process.env.USERDATA_TIME_TO_LIVE_SECONDS || 0,
      prefix: "userdata",
    },
    orderStatus: {
      url:
        process.env.ORDERSTATUS_URL ||
        "http://ors-maintenance.iscrum-ors-prod.svc.cloud.dbc.dk:8080/",
      ttl: process.env.ORDERSTATUS_TIME_TO_LIVE_SECONDS || 60 * 5,
      prefix: "orderstatus",
    },
  },
};
