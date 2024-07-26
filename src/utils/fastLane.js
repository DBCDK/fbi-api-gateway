import { set, get } from "../datasources/redis.datasource";

const { visit } = require("graphql");

// 10 minutes
const TIME_TO_LIVE_SECONDS = 60 * 10;

// These are the only types that are allowed for fast lane
// Nothing user related can be in here
const ALLOWED_TYPES = {
  Boolean: true,
  String: true,
  DateTimeScalar: true,
  Int: true,
  BranchResult: true,
  Branch: true,
  AgencyType: true,
  Manifestation: true,
  ManifestationTitles: true,
  Work: true,
  Creator: true,
  MaterialType: true,
  Cover: true,
  Role: true,
  Translation: true,
  GeneralMaterialType: true,
  GeneralMaterialTypeCode: true,
  SpecificMaterialType: true,

  EntityQueryResult: true,
  Entity: true,
  FieldNodeLangcode: true,
  FieldNodeNotificationFieldNotificationText: false, // notifications should be visible immediately
  Inspiration: true,
  Categories: true,
  Category: true,
  ComplexSearchResponse: true,
  SuggestResponse: true,
  Suggestion: true,
  SuggestionType: true,
  CategoryResult: true,
  WorkTitles: true,
  WorkType: true,
  Manifestations: true,
  Identifier: true,
  IdentifierType: true,
  Languages: true,
  Language: true,
  PhysicalDescription: true,
  Edition: true,
  PublicationYear: true,
  HostPublication: true,
  AccessType: true,
  Access: false, // Disabled: Uniontype which can hold a user-specific url (proxy)
  AccessUrlType: true,
  FictionNonfiction: true,
  FictionNonfictionCode: true,
  Audience: true,
  ChildOrAdult: true,
  ChildOrAdultCode: true,
  SchoolUse: true,
  Range: true,
  Note: true,
  NoteType: true,
  Relations: true,
  TableOfContent: true,
  SubjectContainer: true,
  Subject: true,
  SubjectType: true,
  Series: true,
  SerieWork: true,
  Universes: true,
  NumberInSeries: true,
  RecommendationResponse: true,
  Recommendation: true,
  ManifestationParts: true,
  ManifestationPart: true,
  Classification: true,
  Localizations: true,
  holdingAgency: true,
  holdingsItem: true,
  Shelfmark: true,
  HoldingsResponse: true,
  HoldingsResponseStatus: true,
  HoldingsItem: true,
};

/**
 * Collect all the return types that are requested in query
 */
function getAllTypesFromQuery(document, schema) {
  const types = schema.getTypeMap();
  const visitedTypes = {};
  function getRealType(type) {
    while (type?.type) {
      type = type.type;
    }
    return type?.name?.value;
  }

  let currentType = [types.Query];

  const namedObjectVisitor = {
    enter(node) {
      if (node.typeCondition?.name?.value) {
        currentType = [types[node.typeCondition?.name?.value]];

        return;
      }
      if (
        node.name &&
        node.kind === "Field" &&
        currentType[currentType.length - 1]?.getFields
      ) {
        const type = getRealType(
          currentType[currentType.length - 1].getFields()[node?.name?.value]
            ?.astNode?.type
        );
        if (type) {
          node.visited = true;
          visitedTypes[type] = true;
          //   console.log("enter field:", node?.name?.value, type, currentType);
          currentType.push(types[type]);
        }
      }
    },
    leave(node) {
      if (node.typeCondition?.name?.value) {
        currentType = [types.Query];

        return;
      }
      if (node.visited) {
        currentType.pop();
      }
    },
  };
  visit(document, namedObjectVisitor);
  return visitedTypes;
}
/**
 * Check if the query allows for fast lane
 */
export default function isFastLaneQuery(document, schema) {
  try {
    if (
      document.definitions.find(
        (definition) => definition.operation === "mutation"
      )
    ) {
      return false;
    }
    const requestedTypes = getAllTypesFromQuery(document, schema);

    // For debugging purpose, which types from query are not allowed
    // console.log(
    //   Object.keys(requestedTypes).filter((type) => !ALLOWED_TYPES[type])
    // );

    return Object.keys(requestedTypes).every((type) => ALLOWED_TYPES[type]);
  } catch (e) {
    return false;
  }
}

/**
 * Set in Redis
 */
export function setFastLane(key, obj) {
  return set(key, TIME_TO_LIVE_SECONDS, obj);
}

/**
 * Get from Redis
 */
export async function getFastLane(key, stats) {
  const datasourceName = "fastLane";
  stats.incrementCount(datasourceName, 1);
  stats.incrementRedisLookups(datasourceName, 1);
  const res = (await get(key, false, stats, datasourceName))?.val;
  if (res) {
    stats.incrementRedisHits(datasourceName, 1);
  }
  return res;
}

/**
 * Collects fast lane results and puts in Redis
 */
export function fastLaneMiddleware(req, res, next) {
  var oldWrite = res.write,
    oldEnd = res.end;

  var chunks = [];

  res.write = function (chunk, encoding) {
    chunks.push(Buffer.from(chunk, encoding));

    oldWrite.apply(res, arguments);
  };

  res.end = function (chunk, encoding) {
    if (req.fastLane && !req.fastLaneRes && !req.graphQLErrors) {
      if (chunk) chunks.push(Buffer.from(chunk, encoding));

      var body = Buffer.concat(chunks).toString("utf8");
      setFastLane(req.fastLaneKey, body);
    }

    oldEnd.apply(res, arguments);
  };

  next();
}
