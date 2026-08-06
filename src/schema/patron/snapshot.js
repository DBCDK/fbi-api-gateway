/**
 * @file Shared snapshot type for patron material-like items.
 *
 */

function isWorkId(materialId) {
  return typeof materialId === "string" && materialId.startsWith("work-of:");
}

function firstCreator(material) {
  if (Array.isArray(material?.creators)) {
    return material.creators[0]?.display || null;
  }

  return (
    material?.creators?.persons?.[0]?.display ||
    material?.creators?.corporations?.[0]?.display ||
    null
  );
}

function materialTypeCode(material) {
  const specific = material?.materialTypes?.[0]?.specific;
  return (typeof specific === "string" ? specific : specific?.code) || null;
}

function mainLanguage(material) {
  const language = material?.languages?.main?.[0];
  if (typeof language === "string") {
    return language;
  }

  return language?.isoCode || language?.iso639Set2 || language?.display || null;
}

/**
 * Build the common snapshot persisted for Patron bookmarks and historical loans.
 */
export function buildPatronMaterialSnapshot(material) {
  const hostPublication = material?.hostPublication;

  return {
    pid: material?.pid || null,
    workId: material?.workId || material?.ownerWork?.workId || null,
    title: material?.titles?.main?.[0] || null,
    creator: firstCreator(material),
    materialType: materialTypeCode(material),
    workType: material?.workTypes?.[0] || null,
    periodical: hostPublication
      ? {
          edition: hostPublication.edition || null,
          pages: hostPublication.pages || null,
          publisher: hostPublication.publisher || null,
          language: mainLanguage(material),
        }
      : null,
  };
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
