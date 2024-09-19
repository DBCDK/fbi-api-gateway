/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

// timestamp: DateTimeScalar

export const typeDef = `
  type ItemIdResponse {
    """
    Message field in case of an error.
    """
    message: String
    """
    ItemId response object.
    """
    itemOrderEntity: ItemOrderEntity
  } 

  type ItemOrderEntity {
    """
    Key for the row in the database, can be ignored as it's only relevant for ORS.
    """
    itemOrderKey: Int!
    """
    Order ID associated with the item ID.
    """
    orderId: String!
    """
    Item ID, the same value that was queried.
    """
    itemId: String!
    """
    Agency ID of the lender of the material.
    """
    responderId: String!
    """
    Agency ID of the borrower of the material.
    """
    requesterId: String!
    """
    Timestamp of when the row was created in the database.
    Example: "2024-09-09T07:32:24.081+00:00"
    """
    timestamp: String!
  }

  type OrsQuery {
    """
    Method to retrieve sender and receiver information from ORS based on an itemId.
    """
    itemOrder(itemId: String!): ItemIdResponse!
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
      return await context.datasources.getLoader("itemOrder").load({ itemId });
    },
  },

  ItemIdResponse: {
    message(parent, args, context, info) {
      return parent?.message || null;
    },
    itemOrderEntity(parent, args, context, info) {
      if (parent?.message) {
        return null;
      }
      return parent.itemOrderEntity;
    },
  },
};
