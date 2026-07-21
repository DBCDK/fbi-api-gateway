/**
 * @file Shared snapshot type for patron material-like items.
 *
 */

function isWorkId(materialId) {
  return typeof materialId === "string" && materialId.startsWith("work-of:");
}

export const typeDef = `
    type PatronMaterialSnapshot {
        """
        Stored pid for the material, if known.
        """
        pid: String

        """
        Stored work id for the material, if known.
        """
        workId: String

        """
        Stored title for the material.
        """
        title: String

        """
        Stored creator for the material.
        """
        creator: String

        """
        Stored material type for the material.
        """
        materialType: String

        """
        Stored work type for the material.
        """
        workType: String
    }
`;

export const resolvers = {
  PatronMaterialSnapshot: {
    async pid(parent, args, context, info) {
      if (parent?.pid) {
        return parent.pid;
      }

      if (parent?._sourceMaterialId) {
        return isWorkId(parent._sourceMaterialId) ? null : parent._sourceMaterialId;
      }

      if (parent?._sourceFaust) {
        return await context.datasources.getLoader("faustToPid").load({
          faust: parent._sourceFaust,
          profile: context.profile,
        });
      }

      return null;
    },

    async workId(parent, args, context, info) {
      if (parent?.workId) {
        return parent.workId;
      }

      if (parent?._sourceMaterialId && isWorkId(parent._sourceMaterialId)) {
        return parent._sourceMaterialId;
      }

      if (parent?._sourceFaust) {
        return await context.datasources.getLoader("faustToWorkId").load({
          faust: parent._sourceFaust,
          profile: context.profile,
        });
      }

      return null;
    },
  },
};
