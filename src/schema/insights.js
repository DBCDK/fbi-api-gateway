// graphql/insights.schema.js
const { parse, visit, getNamedType } = require("graphql");

export const typeDef = `
type FieldInsight {
  path: String
  type: String         # parent type navn (fx "Query", "User")
  kind: String         # feltets (afpakkede) returtype (fx "String", "User")
  field: String!
  count: Int!
}

type ClientInsight {
  clientId: String!
  fields: [FieldInsight!]!
}

type Insight {
  start: String!
  end: String!
  clients(clientId: String): [ClientInsight!]!
}

extend type Query {
  insights(days: Int, clientId: String): Insight
}
`;

function getFieldPaths(typeMap, queryString, out, count) {
  const ast = parse(queryString);
  const stack = [];

  visit(ast, {
    enter(node) {
      if (node.kind === "OperationDefinition") {
        stack.push({
          type:
            node.operation === "mutation" ? typeMap.Mutation : typeMap.Query,
          fieldName: node.operation === "mutation" ? "Mutation" : "Query",
        });
        return;
      }
      if (node.kind === "Field") {
        const parent = stack[stack.length - 1];
        const parentType = parent?.type;
        const fieldName = node.name.value;

        const fieldDef = parentType?.getFields?.()[fieldName];
        if (!fieldDef) {
          stack.push({ fieldName, type: undefined });
          const pathStr = stack.map((e) => e.fieldName).join(".");
          if (!out[pathStr]) {
            out[pathStr] = {
              path: pathStr,
              type: parentType?.name || null,
              kind: null,
              field: fieldName,
              count: 0,
            };
          }
          out[pathStr].count += count;
          return;
        }

        const namedType = getNamedType(fieldDef.type);
        const nextType = typeMap[namedType?.name];

        stack.push({ fieldName, type: nextType });

        const pathStr = stack.map((e) => e.fieldName).join(".");
        if (!out[pathStr]) {
          out[pathStr] = {
            path: pathStr,
            type: parentType?.name || null,
            kind: namedType?.name || null,
            field: fieldName,
            count: 0,
          };
        }
        out[pathStr].count += count;
      }
    },
    leave(node) {
      if (node.kind === "Field" || node.kind === "OperationDefinition") {
        stack.pop();
      }
    },
  });

  return out;
}

export const resolvers = {
  Query: {
    async insights(_parent, args, context, info) {
      // --- days clamp (server-side) ---
      const daysRaw = Number.isFinite(args?.days) ? args.days : 14;
      const days = Math.max(1, Math.min(30, Math.floor(daysRaw)));

      const end = new Date();
      end.setUTCHours(0, 0, 0, 0);

      const start = new Date(end);
      start.setUTCDate(end.getUTCDate() - days);

      const res = await context.datasources.getLoader("insights").load({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const typeMap = info.schema.getTypeMap();
      const profileMap = Object.create(null);

      // ES-struktur:
      // aggregations["2"].buckets[*].key = parsedQuery
      // aggregations["2"].buckets[*]["3"].buckets[*].key = clientId
      const parsedQueryAgg = res?.aggregations?.["2"];
      if (!parsedQueryAgg?.buckets?.length) {
        return {
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
          const clientId = String(key).split("/")[0];

          // doc_count pr. klient-bucket
          const count = profileBucket?.doc_count ?? 0;
          if (count <= 0) continue;

          // Hvis der er et clientId-argument, kan vi allerede her springe andre over (let post-filter)
          if (args?.clientId && clientId !== args.clientId) continue;

          const entry = (profileMap[clientId] ??= {
            clientId,
            fieldsMap: Object.create(null),
          });

          try {
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
        start: start.toISOString(),
        end: end.toISOString(),
        clients,
      };
    },
  },

  // Beholder stadig Insight.clients(clientId) for bagudkompatibilitet
  Insight: {
    clients(parent, { clientId }) {
      const all = parent.clients || [];
      if (!clientId) return all;
      return all.filter((c) => c.clientId === clientId);
    },
  },
};
