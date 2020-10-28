import { makeExecutableSchema, mergeSchemas } from "graphql-tools";

import {
  typeDef as WorkManifestation,
  resolvers as WorkManifestationResolvers
} from "./workmanifestation";
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
import { typeDef as SEO, resolvers as SEOResolvers } from "./seo";
import { typeDef as Series, resolvers as SeriesResolvers } from "./series";
import { typeDef as Subject, resolvers as SubjectResolvers } from "./subject";
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
      manifestation(pid: String!): WorkManifestation!
      work(id: String!): Work
    }`,
    Work,
    WorkManifestation,
    Manifestation,
    Recommendation,
    Review,
    Creator,
    SearchQuery,
    SEO,
    Series,
    Subject,
    AdminData,
    Cover
  ],
  resolvers: {
    Query: {
      manifestation(parent, args, context, info) {
        return { id: args.pid };
      },
      async work(parent, args, context, info) {
        const { work } = await context.datasources.workservice.load(args.id);
        return { ...work, id: args.id };
      }
    },
    ...WorkManifestationResolvers,
    ...WorkResolvers,
    ...ManifestationResolvers,
    ...RecommendationResolvers,
    ...ReviewResolvers,
    ...CreatorResolvers,
    ...SearchQueryResolvers,
    ...SEOResolvers,
    ...SeriesResolvers,
    ...SubjectResolvers,
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
