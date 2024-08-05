/**
 * @file Type definitions and resolvers for stats
 *
 */

const { parse, visit, isLeafType } = require("graphql");

export const typeDef = `
type UsageResult {
  timestamp: String!
  operationName: String!
  combined: String!
}

type UsageFetchDebug {
  totalMs: String
  didTimeout: Boolean
}


type UsageResponse {
  hasMatch: Boolean!
  parsedQuery: String
  queryVariables: String
  opeartionName: String
  profile: String
  agencyId: String
  timestamp: String
  debug: UsageFetchDebug,
}

input UsageOptionsInput {
  q: String!
  days: Int
  clientId: String
  agencyId: String
  profile: String
}

type InsightsResponse {
  usage(options: UsageOptionsInput): UsageResponse
}

extend type Query {
  insights: InsightsResponse!
}`;

export const resolvers = {
  Query: {
    insights(parent, args, context, info) {
      return {};
    },
  },
  InsightsResponse: {
    async usage(parent, args, context, info) {
      const days = args?.options?.days || 1;

      const end = new Date();
      end.setUTCHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(end.getDate() - days);

      const res = await context.datasources.getLoader("elastic").load({
        start: start.toISOString(),
        end: end.toISOString(),
        clientId: args?.options?.clientId,
        agencyId: args?.options?.agencyId,
        profile: args?.options?.profile,
        q: args?.options?.q,
      });

      const hit = res.hits.hits[0];
      const hasHit = !!hit;

      if (!hasHit) {
        return {
          hasMatch: hasHit,
          debug: { didTimeout: res.timed_out, totalMs: res.took },
        };
      }

      const source = hit?._source;

      return {
        debug: { didTimeout: res.timed_out, totalMs: res.took },
        hasMatch: hasHit,
        timestamp: source.timestamp,
        parsedQuery: source.parsedQuery,
        queryVariables: JSON.stringify(source.queryVariables),
        opeartionName: source.operationName,
        profile: source.profile?.name,
        agencyId: source.profile?.agency,
      };
    },
  },
};
