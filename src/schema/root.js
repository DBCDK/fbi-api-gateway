/**
 * @file Root type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";
import { createHistogram } from "../utils/monitor";

/**
 * The root type definitions
 */
export const typeDef = `
type Query {
  manifestation(pid: String!): WorkManifestation!
  monitor(name: String!): String!
  user: User!
  work(id: String!): Work
  search(q: String!, limit: PaginationLimit!, offset: Int, facets: [FacetFilter]): SearchResponse!
  suggest(q: String!): SuggestResponse!
  help(q: String!, language: LanguageCode): HelpResponse
  library(agencyid: String!, language: LanguageCode): Library
  deleteOrder(orderId: String!, orderType: OrderType!): SubmitOrder
}

type Mutation {
  data_collect(input: DataCollectInput!): String!
  submitOrder(input: SubmitOrderInput!): SubmitOrder
}`;

/**
 * Root resolvers
 */
export const resolvers = {
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
      return { ...args };
    },
    async user(parent, args, context, info) {
      return { ...args };
    },
    async work(parent, args, context, info) {
      const { work } = await context.datasources.workservice.load(args.id);
      return { ...work, id: args.id };
    },
    async search(parent, args, context, info) {
      return {
        q: args.q,
        limit: args.limit,
        offset: args.offset,
        facets: args.facets,
      };
    },
    async library(parent, args, context, info) {
      return {
        agencyid: args.agencyid,
        language: args.language,
        accessToken: context.accessToken,
      };
    },
    async suggest(parent, args, context, info) {
      return { q: args.q };
    },
    async deleteOrder(parent, args, context, info) {
      return await context.datasources.deleteOrder.load({
        orderId: args.orderId,
        orderType: args.orderType,
        accessToken: context.accessToken,
      });
    },
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
    },
    async submitOrder(parent, args, context, info) {
      return await context.datasources.submitOrder.load({
        input: args.input,
        accessToken: context.accessToken,
      });
    },
  },
};
