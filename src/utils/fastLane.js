import { set, get } from "../datasources/redis.datasource";

const { visit } = require("graphql");

// 10 minutes
const TIME_TO_LIVE_SECONDS = 60 * 10;

// These are the only types that are allowed for fast lane
// Nothing user related can be in here
const ALLOWED_TYPES = {
  Boolean: true,
  String: true,
  DateTime: true,
  BookMarkResponse: true,
  Int: true,
  BookMark: true,
  UserSubscriptions: true,
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
  FieldNodeNotificationFieldNotificationText: true,
  Inspiration: true,
  Categories: true,
  Category: true,
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
  Access: true,
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
  Universe: true,
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
export async function getFastLane(key) {
  return (await get(key))?.val;
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
    if (req.fastLane) {
      if (chunk) chunks.push(Buffer.from(chunk, encoding));

      var body = Buffer.concat(chunks).toString("utf8");
      setFastLane(req.fastLaneKey, body);
    }

    oldEnd.apply(res, arguments);
  };

  next();
}