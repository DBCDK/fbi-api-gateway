// graphql/insights.schema.js
const { parse, visit, getNamedType } = require("graphql");

export const typeDef = `
type FieldInsight {
  path: String
  type: String         # parent type name (e.g. "Query", "User")
  kind: String         # unwrapped return type (e.g. "String", "User")
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
  insights(days: Int): Insight
}
`;

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
      const n = Number.isFinite(args?.days) ? Math.floor(args.days) : 14;
      const windowDays = Math.max(1, Math.min(30, n));

      // FIX #1: rullende vindue (nu som end), ikke nulstilling til UTC-midnat
      const end = new Date(); // nu
      const start = new Date(end.getTime() - windowDays * 24 * 60 * 60 * 1000);

      const res = await context.datasources.getLoader("insights").load({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const typeMap = info.schema.getTypeMap();
      const profileMap = Object.create(null);

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
        start: start.toISOString(),
        end: end.toISOString(),
        clients,
      };
    },
  },

  // nested filter (valgfrit): clients(clientId: ...)
  Insight: {
    clients(parent, { clientId }) {
      const all = parent.clients || [];
      if (!clientId) return all;
      return all.filter((c) => c.clientId === clientId);
    },
  },
};
