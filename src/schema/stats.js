/**
 * @file Type definitions and resolvers for stats
 *
 */

const { parse, visit, isLeafType } = require("graphql");

export const typeDef = `
type FieldStat {
  path: String
  typeName: String
  fieldName: String!
  count: Int!
}
type ProfileStat {
  start: String!
  end: String!
  name: String!
  agency: String!
  fields: [FieldStat!]!
}
type Stats {
  weekly: [ProfileStat!]!
}

extend type Query {
  stats: Stats
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

        // type name of current node
        const typeName = fields?.[fieldName]?.type
          ?.toString()
          ?.replace?.(/[\[\]\!]/g, "");

        // Whether this node is a leaf
        const isLeaf = isLeafType(fields?.[fieldName]?.type);

        // Push to current path, and add node to res
        stack.push({ fieldName, type: typeMap[typeName] });
        const pathStr = stack.map((entry) => entry.fieldName).join(".");
        if (!res[pathStr]) {
          res[pathStr] = {
            path: pathStr,
            typeName: typeName,
            fieldName,
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
    async stats(parent, args, context, info) {
      const end = new Date();
      end.setUTCHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(end.getDate() - 7);

      const res = await context.datasources.stats.load({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const typeMap = info.schema.getTypeMap();

      const profileMap = {};
      Object.values(res.aggregations).forEach((aggregation) => {
        aggregation.buckets.forEach((bucket) => {
          bucket?.[3]?.buckets?.forEach((profileBucket) => {
            const [agency, name] = profileBucket?.key?.split("/");
            const count = bucket.doc_count;
            const query = bucket.key;
            if (!profileMap[profileBucket?.key]) {
              profileMap[profileBucket?.key] = {
                name,
                agency,
                fieldsMap: {},
                start: start.toISOString(),
                end: end.toISOString(),
              };
            }
            getFieldPaths(
              typeMap,
              query,
              profileMap[profileBucket?.key].fieldsMap || {},
              count
            );
          });
        });
      });
      const profiles = Object.values(profileMap).map(
        ({ name, agency, fieldsMap, start, end }) => {
          return { name, agency, fields: Object.values(fieldsMap), start, end };
        }
      );
      return { weekly: profiles };
    },
  },
};
