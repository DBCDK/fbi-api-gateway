import { makeExecutableSchema, mergeSchemas } from "graphql-tools";

import {
  typeDef as ManifestationPreview,
  resolvers as ManifestationPreviewResolvers
} from "./manifestationpreview";
import { typeDef as Work, resolvers as WorkResolvers } from "./work";
import {
  typeDef as Manifestation,
  resolvers as ManifestationResolvers
} from "./manifestation";
import {
  typeDef as Recommendation,
  resolvers as RecommendationResolvers
} from "./recommendation";
import { typeDef as Review, resolvers as ReviewResolvers } from "./review";
import { typeDef as Creator, resolvers as CreatorResolvers } from "./creator";
import {
  typeDef as SearchQuery,
  resolvers as SearchQueryResolvers
} from "./searchquery";
import { typeDef as Series, resolvers as SeriesResolvers } from "./series";
import {
  typeDef as AdminData,
  resolvers as AdminDataResolvers
} from "./admindata";
import { typeDef as Cover, resolvers as CoverResolvers } from "./cover";
import drupalSchema from "./external/drupal";

/**
 * Create executable schema from type definitions and resolvers
 */
export const internalSchema = makeExecutableSchema({
  typeDefs: [
    `type Query {
      manifestation(pid: String!): Manifestation!
      work(id: String!): Work
    }`,
    Work,
    ManifestationPreview,
    Manifestation,
    Recommendation,
    Review,
    Creator,
    SearchQuery,
    Series,
    AdminData,
    Cover
  ],
  resolvers: {
    Query: {
      manifestation(parent, args, context, info) {
        return { pid: args.pid };
      },
      async work(parent, args, context, info) {
        const { work } = await context.datasources.workservice.load(args.id);
        return { ...work, id: args.id };
      }
    },
    ...ManifestationPreviewResolvers,
    ...WorkResolvers,
    ...ManifestationResolvers,
    ...RecommendationResolvers,
    ...ReviewResolvers,
    ...CreatorResolvers,
    ...SearchQueryResolvers,
    ...SeriesResolvers,
    ...AdminDataResolvers,
    ...CoverResolvers
  }
});

/**
 * We stitch the internal schema together with the external drupal schema
 */
export default async () => {
  return mergeSchemas({
    subschemas: [{ schema: await drupalSchema() }, { schema: internalSchema }]
  });
};
