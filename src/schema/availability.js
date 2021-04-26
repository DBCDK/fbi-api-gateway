/**
 * @file availability type definition and resolvers
 *
 */

import { getArray } from "../utils/utils";
import { get } from "lodash";

export const typeDef = `
   type Availability {
    willLend: Boolean
    expectedDelivery: String
    orderPossible: Boolean
    orderPossibleReason: String
   }`;

export const resolvers = {
  Availability: {
    willLend(parent, args, context, info) {
      return parent.willLend;
    },
    expectedDelivery(parent, args, context, info) {
      return parent.expectedDelivery || "";
    },
    orderPossible(parent, args, context, info) {
      return parent.orderPossible;
    },
    orderPossibleReason(parent, args, context, info) {
      return parent.orderPossibleReason;
    },
  },
};
