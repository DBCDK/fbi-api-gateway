/**
 * @file Root type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";
import { createHistogram } from "../utils/monitor";
import { createIndexer } from "../utils/searcher";

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
  suggest(q: String!, worktype: WorkType): SuggestResponse!
  help(q: String!, language: LanguageCode): HelpResponse
  branches(agencyid: String, branchId: String, language: LanguageCode, q: String, offset: Int, limit: PaginationLimit): BranchResult!
  deleteOrder(orderId: String!, orderType: OrderType!): SubmitOrder
  borchk(libraryCode: String!, userId: String!, userPincode: String!): BorchkRequestStatus!
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
    async manifestation(parent, args, context, info) {
      // Fetch work to get workTypes (used by the articleContent)
      const id = `work-of:${args.pid}`;
      const { work } = await context.datasources.workservice.load(id);

      return { id: args.pid, workTypes: work.workTypes };
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
    async branches(parent, args, context, info) {
      return await context.datasources.library.load({
        q: args.q,
        limit: args.limit,
        offset: args.offset,
        language: args.language,
        agencyid: args.agencyid,
        branchId: args.branchId,
      });
    },
    async suggest(parent, args, context, info) {
      return { q: args.q, worktype: args.worktype };
    },
    async deleteOrder(parent, args, context, info) {
      return await context.datasources.deleteOrder.load({
        orderId: args.orderId,
        orderType: args.orderType,
        accessToken: context.accessToken,
      });
    },
    async borchk(parent, args, context, info) {
      return context.datasources.borchk.load({
        libraryCode: args.libraryCode,
        userId: args.userId,
        userPincode: args.userPincode,
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
