/**
 * @file This file handles /holdings requests from fbs-adapter
 *
 */

export const typeDef = `
    extend type HoldingsResponse {
    """
    Indicates whether the item can be reserved according to the Cicero API (booking allowed).
    """
       reservable: Boolean
    }
 `;

export const resolvers = {
  HoldingsResponse: {
    async reservable(parent, args, context, info) {
      const recordId = parent?.items?.[0]?.bibliographicRecordId;
      const agencyId = parent?.items?.[0]?.agencyId;

      if (parent?.items) {
        console.log("items", parent?.items);
      }

      // Create the account
      const res = await context.datasources
        .getLoader("holdings")
        .load({ agencyId, recordId });

      return res?.reservable || null;
    },
  },
};
