/**
 * @file This file handles /holdings requests from fbs-adapter
 *
 */

export const typeDef = `
    extend type HoldingsResponse {
    """
    Represents the overall reservability status across all items according to the Cicero API (booking allowed).
    """
       reservable: Boolean
    }

    extend type HoldingsItem {
    """
    Indicates whether the item can be reserved according to the Cicero API (booking allowed).
    """
       reservable: Boolean

    """
    The pid of the holdingsitem
    """
       pid: String
    }
 `;

export const resolvers = {
  HoldingsResponse: {
    async reservable(parent, args, context) {
      const items = parent?.items ?? [];
      if (items.length === 0) return null;

      let hasFalse = false;

      for (const item of items) {
        const res = await context.datasources.getLoader("holdings").load({
          agencyId: item?.agencyId,
          recordId: item?.bibliographicRecordId,
        });

        if (res?.reservable === true) return true;
        if (res?.reservable === false) hasFalse = true;
      }

      return hasFalse ? false : null;
    },
  },
  HoldingsItem: {
    async reservable(parent, args, context, info) {
      const recordId = parent?.bibliographicRecordId;
      const agencyId = parent?.agencyId;

      const res = await context.datasources
        .getLoader("holdings")
        .load({ agencyId, recordId });

      return res?.reservable ?? null;
    },
    async pid(parent, args, context, info) {
      const faust = parent?.bibliographicRecordId;
      const pid = await context.datasources
        .getLoader("faustToPid")
        .load({ faust, profile: context.profile });

      return pid || null;
    },
  },
};
