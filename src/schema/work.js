/**
 * @file Work type definition and resolvers
 *
 */

import { sortBy, orderBy, uniqBy } from "lodash";
import { resolveAuthor, resolveDate } from "./review";
import { getPageDescription } from "../utils/utils";
import translations from "../utils/translations.json";

/**
 * The Work type definition
 */
export const typeDef = `
  enum WorkType {
    analysis,
    article,
    bookdescription,
    game,
    literature,
    map,
    movie,
    music,
    none
    periodica,
    portrait,
    review,
    sheetmusic,
    track,
  }
  type MaterialType {
    materialType: String!
    cover: Cover!
    localizations: Localizations
    manifestations: [WorkManifestation!]!
  }
  type Work {
    title: String
    fullTitle: String
    description: String
    creators: [Creator!]!
    cover: Cover!
    id: String!
    manifestations: [WorkManifestation!]!
    materialTypes: [MaterialType!]!
    path: [String!]!
    reviews: [Review!]!
    series: Series
    seo: SEO!
    subjects: [Subject!]!
    workTypes: [WorkType!]!
  }
`;

/**
 * These are the resolvers for the Work type definition
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  MaterialType: {
    async cover(parent, args, context, info) {
      const covers = await Promise.all(
        parent.manifestations.map((manifestation) => {
          return context.datasources.moreinfoCovers.load(manifestation.id);
        })
      );
      // Find a valid cover.
      const cover = covers.find((entry) => entry.detail);
      return cover || {};
    },

    async localizations(parent, args, context, info) {
      // @TODO - check hostpublicationpid ..
      // @TODO should we do this for articles only ??
      // @TODO or acutally we should not do this at all but get it from workservice
      const allmanifestations = await Promise.all(
        parent.manifestations.map((manifestation) => {
          return context.datasources.openformat.load(manifestation.id);
        })
      );

      const pids = allmanifestations.map(
        (manifestation) =>
          manifestation?.details?.hostPublicationPid?.$ ||
          manifestation.admindata.pid.$
      );

      const locs = await context.datasources.localizations.load({
        pids: pids,
      });
      return locs;
    },
  },
  Work: {
    async cover(parent, args, context, info) {
      const records = flattenRecords(parent);
      const covers = await Promise.all(
        records.map((record) => {
          return context.datasources.moreinfoCovers.load(record.id);
        })
      );

      // Find a valid cover.
      // TODO how to determine which cover to select
      const cover = covers.find((entry) => entry.detail);

      return cover || {};
    },
    id(parent, args, context, info) {
      return parent.workId;
    },
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
    async reviews(parent, args, context, info) {
      // We find relations that are reviews
      // and load data from openformat
      let reviews = (
        await Promise.all(
          parent.relations
            .filter((rel) => rel.type === "review")
            .map((review) => context.datasources.openformat.load(review.id))
        )
      ).map((review) => ({
        ...review,
        uniqKey: resolveAuthor(review),
        sortKey: resolveDate(review),
      }));
      reviews = orderBy(reviews, "sortKey", "desc");
      reviews = uniqBy(reviews, "uniqKey");

      return reviews;
    },
    async series(parent, args, context, info) {
      // Continue if series-service contains series data
      const data = await context.datasources.series.load({
        workId: parent.workId,
      });

      if (data) {
        return parent;
      }

      // If no data available, set series to null
      return null;
    },
    async seo(parent, args, context, info) {
      // Get materialTypes via resolver
      const materialTypes = resolvers.Work.materialTypes(
        parent,
        args,
        context,
        info
      );

      // Return title and description
      return {
        title: `${parent.title}${
          parent.creators && parent.creators[0]
            ? ` af ${parent.creators[0].value}`
            : ""
        }`,
        description: getPageDescription({
          title: parent.title,
          creators: parent.creators,
          materialTypes,
        }),
      };
    },
  },
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

  // Get the primary records
  // Prefer 870970-basis, otherwise first record of each group
  // We prefer 870970-basis since this is the pid we use to check for
  // availability, and use when sending order requests.
  // We may need to rethink this if there are cases where we should
  // use another pid (or maybe we need to access all pids in a group)

  const primaryRecords = work.groups.map((group) => {
    return (
      group.records.find((record) => record.id.startsWith("870970-basis")) ||
      group.records[0]
    );
  });

  // Walk through every record
  primaryRecords.forEach((record) => {
    records.push({
      ...record,
      materialType: record.types
        .map((type) => translations.facets.materialType[type]?.da || type)
        .join(" / "),
      workTypes: work.workTypes,
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
  flattenedRecords.forEach((record) => {
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

  // Finally, we return array of types
  // One record per array type
  return Object.entries(materialTypes).map(
    ([materialType, manifestations]) => ({
      materialType,
      manifestations,
    })
  );
}
