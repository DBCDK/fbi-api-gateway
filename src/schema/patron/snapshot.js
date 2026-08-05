/**
 * @file Shared snapshot type for patron material-like items.
 *
 */

function isWorkId(materialId) {
  return typeof materialId === "string" && materialId.startsWith("work-of:");
}

export const typeDef = `
    type PeriodicalSnapshot {
        """
        Stored edition statement for the host publication.
        """
        edition: String

        """
        Stored pages within the host publication.
        """
        pages: String

        """
        Stored publisher of the host publication.
        """
        publisher: String

        """
        Stored language of the periodical material.
        """
        language: String
    }

    type PatronMaterialSnapshot {
        """
        Version of the stored snapshot format.
        """
        version: Int

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

        """
        Stored metadata about the periodical host publication, when relevant.
        """
        periodical: PeriodicalSnapshot
    }
`;

export const resolvers = {
  PatronMaterialSnapshot: {
    periodical(parent) {
      if (parent?.periodical) {
        return parent.periodical;
      }

      const periodical = {
        edition: parent?.edition || null,
        pages: parent?.pages || null,
        publisher: parent?.publisher || null,
        language: parent?.language || null,
      };

      return Object.values(periodical).some(Boolean) ? periodical : null;
    },
    async pid(parent, args, context, info) {
      if (parent?.pid) {
        return parent.pid;
      }

      if (parent?._sourceMaterialId) {
        return isWorkId(parent._sourceMaterialId)
          ? null
          : parent._sourceMaterialId;
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
