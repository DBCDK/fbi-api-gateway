// default rootfields and denytypes
const defaultSettings = {
  allowRootFields: [
    "debug",
    "draft",
    "manifestation",
    "manifestations",
    "search",
    "work",
    "works",
    "suggest",
    "complexSearch",
    "complexSuggest",
    "localSuggest",
    "recommend",
    "recommendations",
    "infomedia",
    "refWorks",
    "ris",
    "elba",
    "library",
    "relatedSubjects",
    "linkCheck",
    "series",
    "universe",
    "mood",
  ],
  denyTypes: ["CheckOrderPolicy", "Availability", "SEO"],
};

// smaug roles map in fbi-api
export default {
  bibdk: {
    allowRootFields: [
      ...defaultSettings.allowRootFields,
      "bibdk",
      "monitor",
      "complexFacets",
      "help",
      "branches",
      "session",
      "localizations",
      "localizationsWithHoldings",
      "ris",
      "inspiration",
      "orderStatus",
      "test",
      "user",
      // mutation
      "submitOrder",
      "submitMultipleOrders",
      "data_collect",
      "deleteOrder",
      "renewLoan",
      "submitSession",
      "deleteSession",
      "users",
      // drupal
      "nodeById",
      "nodeQuery",
    ],
    denyTypes: [],
  },
  "fbs:system": {
    allowRootFields: ["culr", "vip", "marc", "holdingsItems", "ors"],
    denyTypes: [],
  },
  ddbcms: {
    allowRootFields: [...defaultSettings.allowRootFields, "submitOrder"],
    denyTypes: [...defaultSettings.denyTypes, "WorkReview"],
  },
  default: defaultSettings,
};
