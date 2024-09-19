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
  itemOrderKey: int, 
  orderId: String, 
  itemId": String, 
  responderId: String, 
  requesterId: String, 
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
    async ors(parent, args, context, info) {
      const { itemId } = args;

      // Get the account by global credentials
      return await context.datasources.getLoader("itemOrder").load({ itemId });
    },
  },

  OrsResponseStatus: {
    code(parent, args, context, info) {
      return parent?.responseCode;
    },
    message(parent, args, context, info) {
      return parent?.responseMessage;
    },
  },
};
