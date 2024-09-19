/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

// timestamp: DateTimeScalar

export const typeDef = `

type OrsResponseStatus {
  code: String!
  message: String
}

type ItemOrderResponse { 
  itemOrderKey: Int
  orderId: String
  itemId: String
  responderId: String
  requesterId: String
  timestamp: String
  responseStatus: OrsResponseStatus!
} 

type OrsQuery {
  itemOrder(itemId: String!): ItemOrderResponse
}

extend type Query {
  ors: OrsQuery!
}
 `;

export const resolvers = {
  Query: {
    async ors(parent, args, context, info) {
      return {};
    },
  },

  OrsQuery: {
    async itemOrder(parent, args, context, info) {
      const { itemId } = args;

      // Get the account by global credentials
      const res = await context.datasources
        .getLoader("itemOrder")
        .load({ itemId });

      return {
        ...res?.body,
        responseStatus: { code: res?.status, message: res?.body.message },
      };
    },
  },

  OrsResponseStatus: {
    code(parent, args, context, info) {
      console.log("fffffff", parent);

      return parent?.code;
    },
    message(parent, args, context, info) {
      return parent?.message;
    },
  },
};
