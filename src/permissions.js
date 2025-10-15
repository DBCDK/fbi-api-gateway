/**
 * default rootfields and denytypes
 */
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
  denyTypes: [
    "CheckOrderPolicy",
    "Availability",
    "SEO",
    "WorkExtensionUnion",
    "MarcRecord",
  ],
  denyFields: [
    "HoldingsItem.reservable",
    "HoldingsResponse.reservable",
    "CreatorInterface.wikidata",
  ],
};

/**
 * Roles
 */

const bibdk = {
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
    "periodica",
    "creatorByViafid",
  ],
  denyTypes: ["MarcRecord"],
  denyFields: ["HoldingsItem.reservable", "HoldingsResponse.reservable"],
};

/**
 *
 */

// smaug roles map in fbi-api
export default {
  bibdk,
  studiesoeg: { ...bibdk, denyFields: [] },
  "fbs:system": {
    allowRootFields: [
      ...defaultSettings.allowRootFields,
      // "culr", // disabled for now because of security issues with the culr rest service
      "vip",
      "marc",
      "holdingsItems",
      "ors",
      "rawrepo",
    ],
    denyTypes: [],
    denyFields: [...defaultSettings.denyFields],
  },
  ddbcms: {
    allowRootFields: [...defaultSettings.allowRootFields, "submitOrder"],
    denyTypes: [...defaultSettings.denyTypes, "WorkReview"],
    denyFields: [...defaultSettings.denyFields],
  },
  "donotuse-ddbcms-marc-enabled": {
    allowRootFields: [...defaultSettings.allowRootFields, "submitOrder"],
    denyTypes: [
      "CheckOrderPolicy",
      "Availability",
      "SEO",
      "WorkExtensionUnion",
      "WorkReview",
    ],
    denyFields: [...defaultSettings.denyFields],
  },
  default: defaultSettings,
};
