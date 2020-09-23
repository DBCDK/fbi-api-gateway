/**
 * @file Work type definition and resolvers
 *
 */

import { sortBy } from "lodash";

/**
 * The Work type definition
 */
export const typeDef = `
  type Work {
    title: String
    fullTitle: String
    description: String
    creators: [String!]!
    manifestations: [ManifestationPreview!]!
    materialTypes: [ManifestationPreview!]!
    path: [String!]!
    reviews: [Review!]!
    series: Series
    subjects: [String!]!
  }
`;

/**
 * These are the resolvers for the Work type definition
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  Work: {
    manifestations(parent, args, context, info) {
      return flattenRecords(parent);
    },
    materialTypes(parent, args, context, info) {
      return parseMaterialTypes(flattenRecords(parent));
    },
    path(parent, args, context, info) {
      // These are mocked for now.
      // Got to figure out how to generate this path
      return ["Bøger", "Fiktion", "skønlitteratur", "roman"];
    },
    reviews(parent, args, context, info) {
      // mocked
      return [
        {
          author: "Svend Svendsen",
          media: "Jyllandsposten",
          rating: "4/5",
          reviewType: "INFOMEDIA",
          url: "http://"
        },
        {
          author: "Svend Svendsen",
          media: "",
          rating: "4/5",
          reviewType: "LITTERATURSIDEN",
          url: "http://"
        },
        {
          author: "Svend Svendsen",
          media: "",
          rating: "4/5",
          reviewType: "MATERIALREVIEWS",
          url: "http://"
        }
      ];
    },
    series(parent, args, context, info) {
      return parent;
    }
  }
};

/**
 * Flatten records
 *
 * Records with multiple types will be converted
 * into multiple records; one per type
 *
 * @param {Object} work
 */
function flattenRecords(work) {
  // The array that will hold the records
  const records = [];
  // Walk through every record
  work.records.forEach(record => {
    record.types.forEach(typeName => {
      records.push({ ...record, materialType: typeName });
    });
  });

  return sortBy(records, "materialType");
}

/**
 * Parses work manifestations in order to get material types
 *
 * We group all manifestations of the work
 * by type, resulting in a number of arrays.
 * These arrays will be sorted; 870970-basis
 * records will be first in the array.
 *
 * Finally, we pick one manifestation to represent
 * each type.
 * @param {Object} work
 */
function parseMaterialTypes(flattenedRecords) {
  // The object that will hold the types
  const materialTypes = {};

  // Walk through every manifestation
  flattenedRecords.forEach(record => {
    // If we have not seen this type before
    // we put an array in the materialTypes
    if (!materialTypes[record.materialType]) {
      materialTypes[record.materialType] = [];
    }

    // Push to array matching the type
    materialTypes[record.materialType].push(record);
  });

  // Lets have the type names sorted (keys of materialTypes)
  const typeNames = sortBy(Object.keys(materialTypes));

  // Walk through every type name
  typeNames.forEach(typeName => {
    // And sort array of manifestations for this specific type
    materialTypes[typeName] = sortBy(materialTypes[typeName], record => {
      // For now we have 870970 first in the array
      if (record.id.startsWith("870970-basis")) {
        return -1;
      }
      return 0;
    });
  });

  // Finally, we return array of types
  // One record per array type
  return typeNames.map(typeName => materialTypes[typeName][0]);
}
