/**
 * @file Type definitions and resolvers for stats
 *
 */

const { parse, visit, isLeafType } = require("graphql");

export const typeDef = `
type FieldInsight {
  path: String
  type: String
  kind: String
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
  insights: Insight
}

`;

/**
 * Parse query, and count how many times a field is fetched
 * store it in res.
 *
 * @param {*} typeMap
 * @param {*} query
 * @param {*} res
 * @param {*} count
 * @returns
 */
function getFieldPaths(typeMap, query, res, count) {
  const ast = parse(query);
  let stack = [];
  let namedType;
  // Visit nodes of the parsed query
  visit(ast, {
    enter(node, key, parent, path, ancestors) {
      if (node.operation === "mutation") {
        stack.push({ type: typeMap.Mutation, fieldName: "Mutation" });
      } else if (node.operation === "query") {
        stack.push({ type: typeMap.Query, fieldName: "Query" });
      } else if (node.kind === "Field") {
        // All fields of the parent type
        const fields =
          stack[stack.length - 1]?.type?.getFields?.() ||
          typeMap[namedType?.name?.value]?.getFields?.();

        // field name of current node
        const fieldName = node.name.value;

        console.log("##########", fieldName);

        // type name of current node
        const typeName = fields?.[fieldName]?.type
          ?.toString()
          ?.replace?.(/[\[\]\!]/g, "");

        // Whether this node is a leaf
        const isLeaf = isLeafType(fields?.[fieldName]?.type);

        // parent type
        const type = stack[stack.length - 1]?.type;

        // Push to current path, and add node to res
        stack.push({ fieldName, type: typeMap[typeName] });
        const pathStr = stack.map((entry) => entry.fieldName).join(".");
        if (!res[pathStr]) {
          res[pathStr] = {
            path: pathStr,
            type,
            field: fieldName,
            kind: typeName,
            isLeaf,
            count: 0,
          };
        }

        // increment counter for the field/path
        res[pathStr].count += count;
      } else if (node.kind === "NamedType") {
        namedType = node;
      }
    },

    leave(node, key, parent, path, ancestors) {
      if (node.kind === "Field") {
        stack.pop();
      }
    },
  });
  return res;
}

export const resolvers = {
  Query: {
    async insights(parent, args, context, info) {
      const end = new Date();
      end.setUTCHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(end.getDate() - 30);

      const res = await context.datasources.getLoader("insights").load({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      console.log(JSON.stringify(res, null, 2));

      const typeMap = info.schema.getTypeMap();

      const profileMap = {};
      Object.values(res.aggregations).forEach((aggregation) => {
        aggregation.buckets.forEach((bucket) => {
          bucket?.[3]?.buckets?.forEach((profileBucket) => {
            const [clientId] = profileBucket?.key?.split("/");
            const count = bucket.doc_count;
            const query = bucket.key;
            if (!profileMap[profileBucket?.key]) {
              profileMap[profileBucket?.key] = {
                clientId,
                fieldsMap: {},
                start: start.toISOString(),
                end: end.toISOString(),
              };
            }
            try {
              getFieldPaths(
                typeMap,
                query,
                profileMap[profileBucket?.key].fieldsMap || {},
                count
              );
            } catch (e) {
              // skip queries with syntax errors
            }
          });
        });
      });
      const profiles = Object.values(profileMap).map(
        ({ clientId, fieldsMap, start, end }) => {
          return {
            clientId,
            fields: Object.values(fieldsMap),
          };
        }
      );
      return { clients: profiles, start, end };
    },
  },
};
