// graphql/insights.schema.js
const { GraphQLError, parse, visit, getNamedType } = require("graphql");
import { log } from "dbc-node-logger";
import config from "../config";

export const typeDef = `
type FieldInsight {
  path: String
  type: String         # parent type name (e.g. "Query", "User")
  kind: String         # unwrapped return type (e.g. "String", "User")
  field: String!
  count: Int!
  clientCount: Int
  operationCount: Int
  firstSeen: String
  lastSeen: String
}

type FieldClientInsight {
  clientId: String!
  count: Int!
  operationCount: Int
  firstSeen: String
  lastSeen: String
  configuration: InsightClientConfiguration
}

type InsightClientConfiguration {
  displayName: String
}

type SchemaElementInsight {
  key: String!
  count: Int!
  clientCount: Int
  operationCount: Int
  firstSeen: String
  lastSeen: String
}

type ClientInsight {
  clientId: String!
  fields: [FieldInsight!]!
}

type Insight {
  start: String!
  end: String!
  fields: [FieldInsight!]!
  arguments: [SchemaElementInsight!]!
  inputFields: [SchemaElementInsight!]!
  fieldClients(field: String!): [FieldClientInsight!]!
  argumentClients(argument: String!): [FieldClientInsight!]!
  inputFieldClients(inputField: String!): [FieldClientInsight!]!
  clients(clientId: String): [ClientInsight!]! @deprecated(reason: "Use fields and fieldClients expires: 01/03-2027")
}

extend type Query {
  insights(
    from: String
    to: String
    # Legacy fallback. New clients should use from/to.
    days: Int
    clientId: String
    excludeClientId: String
    agencyId: String
    excludeAgencyId: String
    profileName: String
    excludeProfileName: String
  ): Insight
}
`;

async function loadAllPages(loader, path, params, resultKey) {
  const items = [];
  const seenCursors = new Set();
  let cursor;

  do {
    let result;
    try {
      result = await loader.load({
        path,
        params: { ...params, limit: 500, cursor },
      });
    } catch (error) {
      if (error?.code === "INTERVAL_OUTSIDE_RETENTION") {
        const availableFrom = error.earliestAvailableAt
          ? ` Data er tilgængelige fra ${error.earliestAvailableAt}.`
          : "";
        throw new GraphQLError(
          `Den valgte periode ligger uden for TraceQLs retention-vindue.${availableFrom}`
        );
      }
      if (
        ["INVALID_FROM", "INVALID_TO", "INVALID_INTERVAL"].includes(error?.code)
      ) {
        throw new GraphQLError("TraceQL afviste det valgte tidsinterval");
      }
      if (["FILTER_CONFLICT", "INVALID_FILTER"].includes(error?.code)) {
        const filterError = new GraphQLError(
          error.code === "FILTER_CONFLICT"
            ? "Insights-filteret indeholder modstridende værdier"
            : "Insights-filteret indeholder en ugyldig værdi"
        );
        filterError.extensions = { code: error.code };
        throw filterError;
      }
      throw error;
    }
    items.push(...(result?.[resultKey] || []));
    cursor = result?.nextCursor || null;
    if (cursor && seenCursors.has(cursor)) {
      throw new Error("TraceQL returned the same cursor more than once");
    }
    if (cursor) {
      seenCursors.add(cursor);
    }
  } while (cursor);

  return items;
}

function splitFieldKey(fieldKey) {
  const separator = fieldKey.indexOf(".");
  if (separator === -1) {
    return { type: null, field: fieldKey };
  }
  return {
    type: fieldKey.slice(0, separator),
    field: fieldKey.slice(separator + 1),
  };
}

function mapTraceqlField(item, schema) {
  const { type, field } = splitFieldKey(item.field);
  const fieldDefinition = schema.getType(type)?.getFields?.()?.[field];
  return {
    path: item.field,
    type,
    kind: fieldDefinition ? getNamedType(fieldDefinition.type)?.name : null,
    field,
    count: item.requestCount || 0,
    clientCount: item.clientCount,
    operationCount: item.operationCount,
    firstSeen: item.firstSeen,
    lastSeen: item.lastSeen,
  };
}

function mapTraceqlSchemaElement(item, keyName) {
  return {
    key: item[keyName],
    count: item.requestCount || 0,
    clientCount: item.clientCount,
    operationCount: item.operationCount,
    firstSeen: item.firstSeen,
    lastSeen: item.lastSeen,
  };
}

function mapTraceqlClient(client) {
  return {
    clientId: client.clientId,
    count: client.requestCount || 0,
    operationCount: client.operationCount,
    firstSeen: client.firstSeen,
    lastSeen: client.lastSeen,
  };
}

function mapClientConfiguration(response) {
  const raw = Array.isArray(response) ? response[0] : response;
  const source = raw?.configuration || raw?.config || raw?.client || raw;
  if (!source || typeof source !== "object") return null;

  return {
    displayName:
      source.displayName ||
      source.app?.displayName ||
      source.app?.name ||
      source.app?.id ||
      raw?.name ||
      null,
  };
}

function traceqlParams(parent, extra = {}) {
  return {
    from: parent.start,
    ...(parent.explicitTo && { to: parent.end }),
    clientId: parent.clientId,
    excludeClientId: parent.excludeClientId,
    agencyId: parent.agencyId,
    excludeAgencyId: parent.excludeAgencyId,
    profileName: parent.profileName,
    excludeProfileName: parent.excludeProfileName,
    ...extra,
  };
}

function normalizeFilter(value) {
  if (typeof value !== "string") return undefined;
  return value.trim() || undefined;
}

function getDimensionFilters(args = {}) {
  const filters = {};
  [
    ["clientId", "excludeClientId"],
    ["agencyId", "excludeAgencyId"],
    ["profileName", "excludeProfileName"],
  ].forEach(([includeKey, excludeKey]) => {
    const include = normalizeFilter(args[includeKey]);
    const exclude = normalizeFilter(args[excludeKey]);
    if (include && exclude) {
      const error = new GraphQLError(
        `${includeKey} and ${excludeKey} cannot be combined`
      );
      error.extensions = { code: "FILTER_CONFLICT" };
      throw error;
    }
    if (include) filters[includeKey] = include;
    if (exclude) filters[excludeKey] = exclude;
  });
  return filters;
}

function parseTimestamp(value, name) {
  if (typeof value !== "string" || !value.endsWith("Z")) {
    throw new GraphQLError(`${name} must be an ISO-8601 UTC timestamp`);
  }
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new GraphQLError(`${name} must be an ISO-8601 UTC timestamp`);
  }
  return timestamp;
}

function getFieldPaths(typeMap, queryString, out, count) {
  const ast = parse(queryString);
  const stack = [];
  const seen = new Set(); // Deduplikér paths per query

  visit(ast, {
    enter(node) {
      // Operation root (Query/Mutation)
      if (node.kind === "OperationDefinition") {
        stack.push({
          type:
            node.operation === "mutation" ? typeMap.Mutation : typeMap.Query,
          fieldName: node.operation === "mutation" ? "Mutation" : "Query",
        });
        return;
      }

      // Inline fragment -> skift parent-type midlertidigt
      if (node.kind === "InlineFragment" && node.typeCondition) {
        const typeName = node.typeCondition.name.value;
        const t = typeMap[typeName];
        stack.push({ fieldName: `⟨${typeName}⟩`, type: t });
        return;
      }

      // Felt
      if (node.kind === "Field") {
        const parent = stack[stack.length - 1];
        const parentType = parent?.type;
        const fieldName = node.name.value;

        const fieldDef = parentType?.getFields?.()[fieldName];
        let namedType = null;
        let nextType = null;

        if (fieldDef) {
          namedType = getNamedType(fieldDef.type);
          nextType = typeMap[namedType?.name];
        }

        // Push child context (også ved ukendt felt)
        stack.push({ fieldName, type: nextType });

        const pathStr = stack.map((e) => e.fieldName).join(".");

        if (!seen.has(pathStr)) {
          seen.add(pathStr);

          if (!out[pathStr]) {
            out[pathStr] = {
              path: pathStr,
              type: parentType?.name || null,
              kind: namedType?.name || null, // null ved ukendt felt
              field: fieldName,
              count: 0,
            };
          }
          out[pathStr].count += count;
        }
      }
    },
    leave(node) {
      if (
        node.kind === "Field" ||
        node.kind === "OperationDefinition" ||
        node.kind === "InlineFragment"
      ) {
        stack.pop();
      }
    },
  });

  return out;
}

export const resolvers = {
  Query: {
    async insights(_parent, args, context, info) {
      const end = args?.to ? parseTimestamp(args.to, "to") : new Date();
      const dimensionFilters = getDimensionFilters(args);
      let start;

      if (args?.from) {
        start = parseTimestamp(args.from, "from");
      } else {
        const n = Number.isFinite(args?.days) ? Math.floor(args.days) : 14;
        const windowDays = Math.max(1, n);
        start = new Date(end.getTime() - windowDays * 24 * 60 * 60 * 1000);
      }

      if (start >= end) {
        throw new GraphQLError("from must be earlier than to");
      }

      if (config.datasources.traceql.insightsEnabled) {
        return {
          source: "traceql",
          start: start.toISOString(),
          end: end.toISOString(),
          explicitTo: !!args?.to,
          ...dimensionFilters,
        };
      }

      const res = await context.datasources.getLoader("insights").load({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const typeMap = info.schema.getTypeMap();
      const profileMap = Object.create(null);

      const parsedQueryAgg = res?.aggregations?.["2"];
      if (!parsedQueryAgg?.buckets?.length) {
        return {
          source: "elk",
          start: start.toISOString(),
          end: end.toISOString(),
          clients: [],
        };
      }

      for (const queryBucket of parsedQueryAgg.buckets) {
        const query = queryBucket?.key;
        const clientAgg = queryBucket?.["3"];
        if (!query || !clientAgg?.buckets?.length) continue;

        for (const profileBucket of clientAgg.buckets) {
          const key = profileBucket?.key;
          if (key == null) continue;
          const clientId = String(key).split("/")[0]; // behold split som før

          // brug doc_count pr. klient-bucket
          const count = profileBucket?.doc_count ?? 0;
          if (count <= 0) continue;

          const entry = (profileMap[clientId] ??= {
            clientId,
            fieldsMap: Object.create(null),
          });

          try {
            // FIX #2: getFieldPaths deduplikerer paths per query
            getFieldPaths(typeMap, query, entry.fieldsMap, count);
          } catch {
            // skip invalid GraphQL strings
          }
        }
      }

      const clients = Object.values(profileMap).map(
        ({ clientId, fieldsMap }) => ({
          clientId,
          fields: Object.values(fieldsMap).sort((a, b) => b.count - a.count),
        })
      );

      return {
        source: "elk",
        start: start.toISOString(),
        end: end.toISOString(),
        clients,
      };
    },
  },

  // nested filter (valgfrit): clients(clientId: ...)
  Insight: {
    async fields(parent, _args, context, info) {
      if (parent.source === "traceql") {
        const fields = await loadAllPages(
          context.datasources.getLoader("traceqlInsights"),
          "/v1/fields",
          traceqlParams(parent, { sort: "requestCount", direction: "desc" }),
          "fields"
        );
        return fields.map((field) => mapTraceqlField(field, info.schema));
      }

      const fields = new Map();
      for (const client of parent.clients || []) {
        for (const field of client.fields || []) {
          const key = `${field.type}.${field.field}`;
          const current = fields.get(key) || { ...field, count: 0 };
          current.count += field.count;
          fields.set(key, current);
        }
      }
      return [...fields.values()].sort((a, b) => b.count - a.count);
    },
    async arguments(parent, _args, context) {
      if (parent.source !== "traceql") return [];

      const items = await loadAllPages(
        context.datasources.getLoader("traceqlInsights"),
        "/v1/arguments",
        traceqlParams(parent, { sort: "requestCount", direction: "desc" }),
        "arguments"
      );
      return items.map((item) => mapTraceqlSchemaElement(item, "argument"));
    },
    async inputFields(parent, _args, context) {
      if (parent.source !== "traceql") return [];

      const items = await loadAllPages(
        context.datasources.getLoader("traceqlInsights"),
        "/v1/input-fields",
        traceqlParams(parent, { sort: "requestCount", direction: "desc" }),
        "inputFields"
      );
      return items.map((item) => mapTraceqlSchemaElement(item, "inputField"));
    },
    async fieldClients(parent, { field }, context) {
      if (parent.source === "traceql") {
        const clients = await loadAllPages(
          context.datasources.getLoader("traceqlInsights"),
          `/v1/fields/${encodeURIComponent(field)}/clients`,
          traceqlParams(parent),
          "clients"
        );
        return clients.map(mapTraceqlClient);
      }

      return (parent.clients || [])
        .map((client) => {
          const usage = client.fields?.find(
            (item) => `${item.type}.${item.field}` === field
          );
          return usage
            ? { clientId: client.clientId, count: usage.count }
            : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.count - a.count);
    },
    async argumentClients(parent, { argument }, context) {
      if (parent.source !== "traceql") return [];

      const clients = await loadAllPages(
        context.datasources.getLoader("traceqlInsights"),
        `/v1/arguments/${encodeURIComponent(argument)}/clients`,
        traceqlParams(parent),
        "clients"
      );
      return clients.map(mapTraceqlClient);
    },
    async inputFieldClients(parent, { inputField }, context) {
      if (parent.source !== "traceql") return [];

      const clients = await loadAllPages(
        context.datasources.getLoader("traceqlInsights"),
        `/v1/input-fields/${encodeURIComponent(inputField)}/clients`,
        traceqlParams(parent),
        "clients"
      );
      return clients.map(mapTraceqlClient);
    },
    async clients(parent, { clientId }, context, info) {
      if (parent.source === "traceql") {
        if (!clientId) {
          throw new GraphQLError(
            "clientId is required for the legacy clients field when TraceQL Insights is enabled"
          );
        }
        const fields = await loadAllPages(
          context.datasources.getLoader("traceqlInsights"),
          "/v1/fields",
          traceqlParams(parent, {
            clientId,
            sort: "requestCount",
            direction: "desc",
          }),
          "fields"
        );
        return [
          {
            clientId,
            fields: fields.map((field) => mapTraceqlField(field, info.schema)),
          },
        ];
      }
      const all = parent.clients || [];
      if (!clientId) return all;
      return all.filter((c) => c.clientId === clientId);
    },
  },
  FieldClientInsight: {
    async configuration(parent, _args, context) {
      try {
        const response = await context.datasources
          .getLoader("authAdminClient")
          .load(parent.clientId);
        return mapClientConfiguration(response);
      } catch (error) {
        log.warn("Auth Admin client metadata unavailable", {
          clientId: parent.clientId,
          code: error?.code,
          status: error?.status,
          error: error?.message,
        });
        return null;
      }
    },
  },
};
