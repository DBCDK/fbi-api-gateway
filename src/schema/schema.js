import { makeExecutableSchema, mergeSchemas } from "graphql-tools";

import { typeDef as DataCollectInput } from "./input/datacollect";
import { typeDef as DK5, resolvers as DK5Resolvers } from "./dk5";
import { typeDef as Help, resolvers as HelpResolvers } from "./help";
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
import {
  typeDef as Search,
  resolvers as SearchResolvers
} from "./searchresponse";
import {
  typeDef as Suggest,
  resolvers as SuggestResolvers
} from "./suggestions";
import { typeDef as Series, resolvers as SeriesResolvers } from "./series";
import { typeDef as Subject, resolvers as SubjectResolvers } from "./subject";
import {
  typeDef as AdminData,
  resolvers as AdminDataResolvers
} from "./admindata";
import { typeDef as Cover, resolvers as CoverResolvers } from "./cover";
import drupalSchema from "./external/drupal";
import { log } from "dbc-node-logger";
import { createHistogram } from "../utils/monitor";

/**
 * Create executable schema from type definitions and resolvers
 */
export const internalSchema = makeExecutableSchema({
  typeDefs: [
    `type Query {
      manifestation(pid: String!): WorkManifestation!
      monitor(name: String!): String!
      work(id: String!): Work
      search(q: String!): SearchResponse!
      suggest(q: String!): SuggestResponse!
      help(q: String!): HelpResponse
    }`,
    `type Mutation {
      data_collect(input: DataCollectInput!): String!
    }`,
    DataCollectInput,
    DK5,
    Help,
    Work,
    WorkManifestation,
    Manifestation,
    Recommendation,
    Review,
    Creator,
    Search,
    SearchQuery,
    SEO,
    Series,
    Subject,
    Suggest,
    AdminData,
    Cover
  ],
  resolvers: {
    Query: {
      manifestation(parent, args, context, info) {
        return { id: args.pid };
      },
      monitor(parent, args, context, info) {
        try {
          context.monitorName = args.name;
          createHistogram(args.name);
          return "OK";
        } catch (e) {
          return e.message;
        }
      },
      async help(parent, args, context, info) {
        return { q: args.q };
      },
      async work(parent, args, context, info) {
        const { work } = await context.datasources.workservice.load(args.id);
        return { ...work, id: args.id };
      },
      async search(parent, args, context, info) {
        return { q: args.q };
      },
      async suggest(parent, args, context, info) {
        return { q: args.q };
      }
    },
    Mutation: {
      data_collect(parent, args, context, info) {
        // Check that exactly one input type is given
        const inputObjects = Object.values(args.input);
        if (inputObjects.length !== 1) {
          throw new Error("Exactly 1 input must be specified");
        }

        // Convert keys, replace _ to -
        const data = {};
        Object.entries(inputObjects[0]).forEach(([key, val]) => {
          data[key.replace(/_/g, "-")] = val;
        });

        // We log the object, setting 'type: "data"' on the root level
        // of the log entry. In this way the data will be collected
        // by the AI data collector
        log.info("data", { type: "data", message: JSON.stringify(data) });

        return "OK";
      }
    },
    ...DK5Resolvers,
    ...HelpResolvers,
    ...WorkManifestationResolvers,
    ...WorkResolvers,
    ...ManifestationResolvers,
    ...RecommendationResolvers,
    ...ReviewResolvers,
    ...CreatorResolvers,
    ...SearchResolvers,
    ...SearchQueryResolvers,
    ...SEOResolvers,
    ...SeriesResolvers,
    ...SubjectResolvers,
    ...SuggestResolvers,
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
