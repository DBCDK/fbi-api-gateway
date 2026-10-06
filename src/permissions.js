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
    "complexSearchIndexes",
    "complexSuggest",
    "localSuggest",
    "recommend",
    "recommendations",
    "infomedia",
    "retriever",
    "refWorks",
    "ris",
    "elba",
    "library",
    "linkCheck",
    "series",
    "universe",
    "mood",
  ],
  denyTypes: [
    "CheckOrderPolicy",
    "Availability",
    "SEO",
    "WorkExtensionUnion",
    "MarcRecord",
    "CreatorInfo",
  ],
  denyFields: [
    "HoldingsItem.reservable",
    "HoldingsResponse.reservable",
    "SearchResponse.creatorHit",
    "SearchResponse.seriesHit",
    "ComplexSearchResponse.creatorHit",
    "ComplexSearchResponse.seriesHit",
  ],
};

const bibdk = {
  allowRootFields: [
    ...defaultSettings.allowRootFields,
    "bibdk",
    "monitor",
    "complexFacets",
    "branches",
    "session",
    "localizations",
    "localizationsWithHoldings",
    "inspiration",
    "semanticSearch",
    "orderStatus",
    "test",
    "user",
    "submitOrder",
    "submitSkafOrder",
    "closeOrder",
    "submitMultipleOrders",
    "data_collect",
    "deleteOrder",
    "renewLoan",
    "submitSession",
    "deleteSession",
    "users",
    "bibliotekdkCms",
    "periodica",
    "creatorByViafid",
    "creatorByDisplay",
    "patron",
  ],
  denyTypes: ["MarcRecord"],
  denyFields: ["HoldingsItem.reservable", "HoldingsResponse.reservable"],
};

export default {
  default: defaultSettings,

  bibdk,

  studiesoeg: {
    ...bibdk,
    denyFields: [],
  },

  "fbs:system": {
    allowRootFields: [
      ...defaultSettings.allowRootFields,
      "culr",
      "vip",
      "marc",
      "holdingsItems",
      "ors",
      "rawrepo",
      "submitOrder",
    ],
    denyTypes: ["CreatorInfo"],
    denyFields: [...defaultSettings.denyFields],
  },

  reindex: {
    allowRootFields: [...defaultSettings.allowRootFields, "marc"],
    denyTypes: defaultSettings.denyTypes.filter(
      (type) => type !== "MarcRecord"
    ),
    denyFields: [...defaultSettings.denyFields],
  },

  ddbcms: {
    allowRootFields: [
      ...defaultSettings.allowRootFields,
      "submitOrder",
      "patron",
    ],
    denyTypes: [...defaultSettings.denyTypes, "WorkReview"],
    denyFields: [...defaultSettings.denyFields],
  },

  "donotuse-ddbcms-marc-enabled": {
    allowRootFields: [...defaultSettings.allowRootFields, "submitOrder"],
    denyTypes: [
      ...defaultSettings.denyTypes.filter((type) => type !== "MarcRecord"),
      "WorkReview",
    ],
    denyFields: [...defaultSettings.denyFields],
  },
};
