/**
 * @file This file handles "patron" requests, specifically related to bookmarks.
 *
 */

import { log } from "dbc-node-logger";
import { resolveManifestation, resolveWork } from "../../utils/utils";
import {
  normalizeBookmarkId,
  getOverallStatus,
  isPid,
  isWorkId,
  badUserInput,
} from "./utils";
import { buildPatronMaterialSnapshot } from "./snapshot";

const bookmarkIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const serviceStatusMap = {
  ok: "OK",
  already_exists: "ALREADY_EXISTS",
  not_found: "NOT_FOUND",
  unknown_error: "UNKNOWN_ERROR",
};

function mapServiceStatus(status) {
  return serviceStatusMap[status] || "UNKNOWN_ERROR";
}

function mapServiceErrorStatus(error) {
  switch (error?.serviceErrorCode) {
    case "MISSING_ACCESS_TOKEN":
    case "INVALID_ACCESS_TOKEN":
    case "MISSING_USER_ID":
      return "ERROR_UNAUTHENTICATED_TOKEN";
    case "MISSING_BOOKMARK_CONFIGURATION":
      return "ERROR_MISSING_CLIENT_CONFIGURATION";
    default:
      return "FAILED";
  }
}

async function loadMutation(loader, request) {
  try {
    return await loader.load(request);
  } finally {
    loader.clear?.(request);
  }
}

function materialTypeParts(materialType = {}) {
  return {
    general: materialType.general || materialType.materialTypeGeneral,
    specific: materialType.specific || materialType.materialTypeSpecific,
  };
}

function inputMaterialId(input = {}) {
  return input.materialId || null;
}

function normalizeSelection(selection) {
  if (selection == null) {
    return { selection: null, invalidSelection: false };
  }

  const materialTypes = selection?.materialTypes;
  const hasGeneral = materialTypes?.general != null;
  const hasSpecific = materialTypes?.specific != null;

  if (hasGeneral === hasSpecific) {
    return { selection: null, invalidSelection: true };
  }

  const field = hasGeneral ? "general" : "specific";
  const inputCodes = materialTypes[field];
  if (!Array.isArray(inputCodes) || inputCodes.length === 0) {
    return { selection: null, invalidSelection: true };
  }

  const codes = [...new Set(inputCodes)];
  if (
    codes.some((code) => typeof code !== "string" || code.trim().length === 0)
  ) {
    return { selection: null, invalidSelection: true };
  }

  return {
    selection: {
      materialTypes: {
        [field]: codes.sort(),
      },
    },
    invalidSelection: false,
  };
}

function matchesSelection(manifestation, selection) {
  const materialTypes = selection?.materialTypes;
  const field = materialTypes?.general ? "general" : "specific";
  const selectedCodes = materialTypes?.[field] || [];
  const manifestationCodes = new Set(
    (manifestation?.materialTypes || [])
      .map((materialType) => materialTypeParts(materialType)[field]?.code)
      .filter(Boolean)
  );

  return selectedCodes.every((code) => manifestationCodes.has(code));
}

async function resolveBookmarkInput(input, context) {
  const materialId = inputMaterialId(input);
  const isManifestation = isPid(materialId);
  const isWork = isWorkId(materialId);

  if (!isManifestation && !isWork) {
    return { materialId, obj: null, invalidMaterialId: true };
  }

  const { selection, invalidSelection } = normalizeSelection(input.selection);
  if (invalidSelection) {
    return { materialId, obj: null, invalidMaterialId: true };
  }

  if (!selection && isManifestation) {
    const obj = await resolveManifestation({ pid: materialId }, context);
    return {
      materialId,
      selection,
      obj,
      snapshotMaterial: obj,
      invalidMaterialId: false,
    };
  }

  if (!selection) {
    const obj = await resolveWork({ id: materialId }, context);
    return {
      materialId,
      selection,
      obj,
      snapshotMaterial: obj,
      invalidMaterialId: false,
    };
  }

  const work = await resolveWork(
    isWork ? { id: materialId } : { pid: materialId },
    context
  );
  if (!work) {
    return { materialId, selection, obj: null, invalidMaterialId: false };
  }

  const manifestations = (work?.manifestations?.all || []).filter(
    (manifestation) => matchesSelection(manifestation, selection)
  );

  return {
    materialId: work.workId,
    selection,
    obj: manifestations.length > 0 ? { work, manifestations } : null,
    snapshotMaterial: work,
    invalidMaterialId: false,
  };
}

async function resolveStoredBookmarkMaterial(parent, context) {
  const materialId = parent?.materialId;

  if (!materialId) {
    return {};
  }

  if (parent?.selection) {
    const work = await resolveWork({ id: materialId }, context);
    if (!work) {
      return { work: null, manifestation: null, manifestations: [] };
    }
    const manifestations = (work?.manifestations?.all || []).filter(
      (manifestation) => matchesSelection(manifestation, parent.selection)
    );

    return { work, manifestation: null, manifestations };
  }

  if (isWorkId(materialId)) {
    const work = await resolveWork({ id: materialId }, context);
    return { work, manifestation: null, manifestations: null };
  }

  const manifestation = await resolveManifestation(
    { pid: materialId },
    context
  );
  return { work: null, manifestation, manifestations: null };
}

export const typeDef = `
    directive @oneOf on INPUT_OBJECT

    extend type Patron {
        """
        Retrieves the list of bookmarks for the patron, including pagination and sorting options.
        """
        bookmarks(
          applications: [String!]
          orderBy: OrderBookmarksByEnum
          offset: Int
          limit: PaginationLimitScalar
        ): Bookmarks!
    }

    extend type PatronMutation {
        """
        Adds one or more bookmarks for the patron. If a bookmark already exists, it will be ignored.
        """
        addBookmarks(bookmarks: [BookmarksInput!]! dryRun: Boolean): AddBookmarksResponse!

        """
        Deletes one or more bookmarks for the patron. If a bookmark does not exist, it will be ignored.
        """
        deleteBookmarks(ids: [String!]! dryRun: Boolean): DeleteBookmarksResponse!
    }

    type Bookmarks {
        """
        The total number of bookmarks for the patron
        """
        hitcount: Int!

        """
        The overall status of the bookmarks
        """
        status: BookmarksOverallStatusEnum!

        """
        The list of bookmarks for the patron
        """
        items: [BookmarkItem!]!
    }

    type BookmarkItem {
        """
        The unique identifier for the bookmark
        """
        id: String!

        """
        The unique identifier for the material this bookmark points to.
        """
        materialId: String!

        """
        The bibliographic record associated with the bookmark, if it can still be resolved.
        """
        material: BookmarkMaterial!

        """
        The selection applied to the bookmarked work.
        """
        selection: BookmarkSelection

        """
        Stored metadata captured when the bookmark was created.
        """
        snapshot: PatronMaterialSnapshot!

        """
        creation date of the bookmark
        """
        createdAt: DateTimeScalar!

        """
        The application the bookmark belongs to
        """
        application: String!
    }

    type BookmarkMaterial {
      work: Work
      manifestation: Manifestation

      """
      Manifestations matching the bookmark selection. This is not necessarily
      every manifestation in the work.
      """
      manifestations: [Manifestation!]
    }

    type BookmarkSelection {
      materialTypes: BookmarkMaterialTypesSelection!
    }

    type BookmarkMaterialTypesSelection {
      general: [GeneralMaterialTypeCodeEnum!]
      specific: [String!]
    }

    """
    Enum for sorting bookmarks
    """
    enum OrderBookmarksByEnum {
        CREATEDAT_ASC
        CREATEDAT_DESC
        TITLE_ASC
        TITLE_DESC
    }

    input BookmarksInput {
      materialId: String!
      selection: BookmarkSelectionInput
    }

    input BookmarkSelectionInput {
      materialTypes: BookmarkMaterialTypesSelectionInput!
    }

    input BookmarkMaterialTypesSelectionInput @oneOf {
      general: [GeneralMaterialTypeCodeEnum!]
      specific: [String!]
    }

    type AddBookmarksResponse {
      """
      The overall status of the bookmark addition operation.
      """
      status: BookmarksOverallStatusEnum!

      """
      A list of materials for which bookmark addition failed.
      """
      items: [BookmarksStatusItem!]!
    }

    type DeleteBookmarksResponse {
      """
      The overall status of the bookmark deletion operation.
      """
      status: BookmarksOverallStatusEnum!
      
      """
      Number of failed bookmark deletions (e.g., due to non-existent bookmark IDs).
      """
      items: [BookmarksStatusItem!]!
    }

    type BookmarksStatusItem {
      """
      Status of the bookmark addition or deletion attempt for a specific material.
      """
      status: BookmarksStatusEnum!

      """
      The unique identifier for the bookmark that was attempted to be added or deleted.
      """
      id: String

      """
      The unique identifier for the material for which bookmark addition failed (e.g., a PID or work ID).
      """
      materialId: String

      """
      The normalized selection for the bookmark operation.
      """
      selection: BookmarkSelection

      """
      The material for which bookmark addition failed.
      """
      material: BookmarkMaterial
    }

    enum BookmarksOverallStatusEnum {
      OK
      FAILED
      PARTIALLY_FAILED
      ERROR_UNAUTHENTICATED_TOKEN
      ERROR_MISSING_CLIENT_CONFIGURATION
    }

    enum BookmarksStatusEnum {
      OK
      FAILED
      INVALID_ID
      INVALID_MATERIAL_ID
      ALREADY_EXISTS
      NOT_FOUND
      UNKNOWN_ERROR
    }
    `;

export const resolvers = {
  Patron: {
    async bookmarks(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const key = context?.smaug?.gateway?.bookmarks?.key;
      const application = context?.smaug?.gateway?.bookmarks?.app;
      const accessToken = context?.accessToken;
      const {
        applications,
        orderBy = "CREATEDAT_DESC",
        offset = 0,
        limit = 10,
      } = args;

      if (offset < 0) {
        throw badUserInput("offset must be greater than or equal to 0");
      }

      try {
        if (!uniqueId || !accessToken) {
          return {
            hitcount: 0,
            items: [],
            status: "ERROR_UNAUTHENTICATED_TOKEN",
          };
        }

        if (!key || !application) {
          return {
            hitcount: 0,
            items: [],
            status: "ERROR_MISSING_CLIENT_CONFIGURATION",
          };
        }

        const res = await context.datasources
          .getLoader("userDataV2GetBookmarks")
          .load({
            accessToken,
            filterApplications: applications,
            orderBy,
            offset,
            limit,
          });

        return {
          hitcount: res?.hitcount || 0,
          items: res?.items || [],
          status: "OK",
        };
      } catch (error) {
        log.error(
          `Failed to get bookmarks from userData service. Message: ${error.message}`
        );
        return {
          hitcount: 0,
          items: [],
          status: mapServiceErrorStatus(error),
        };
      }
    },
  },
  PatronMutation: {
    async addBookmarks(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const key = context?.smaug?.gateway?.bookmarks?.key;
      const application = context?.smaug?.gateway?.bookmarks?.app;
      const accessToken = context?.accessToken;

      const { dryRun = false, bookmarks = [] } = args;

      if (!uniqueId || !accessToken) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
          items: bookmarks.map((bookmark) => ({
            materialId: inputMaterialId(bookmark),
            status: "FAILED",
          })),
        };
      }

      if (!key || !application) {
        return {
          status: "ERROR_MISSING_CLIENT_CONFIGURATION",
          items: bookmarks.map((bookmark) => ({
            materialId: inputMaterialId(bookmark),
            status: "FAILED",
          })),
        };
      }

      if (bookmarks.length === 0) {
        throw badUserInput("bookmarks must contain at least one item");
      }

      try {
        const resolved = await Promise.all(
          bookmarks.map((bookmark) => resolveBookmarkInput(bookmark, context))
        );

        const items = resolved.map(
          ({ materialId, selection, obj, invalidMaterialId }) => ({
            materialId,
            selection,
            status: invalidMaterialId
              ? "INVALID_MATERIAL_ID"
              : obj
                ? "OK"
                : "NOT_FOUND",
          })
        );

        const data = resolved
          .filter(({ obj }) => obj)
          .map(({ materialId, selection, snapshotMaterial }) => ({
            materialId,
            ...(selection && { selection }),
            snapshot: buildPatronMaterialSnapshot(snapshotMaterial, {
              includeMaterialTypes: true,
            }),
          }));

        // Early return for dry run to avoid unnecessary calls to userData service
        if (dryRun) {
          return {
            status: getOverallStatus(items, ["OK", "ALREADY_EXISTS"]),
            items,
          };
        }

        if (data.length === 0) {
          return {
            status: getOverallStatus(items, ["OK", "ALREADY_EXISTS"]),
            items,
          };
        }

        //  Add bookmarks to userData service
        const loader = context.datasources.getLoader("userDataV2AddBookmarks");
        const request = { accessToken, bookmarks: data };
        const res = await loadMutation(loader, request);

        let serviceResultIndex = 0;
        const itemsWithService = items.map((item) => {
          if (item.status !== "OK") return item;

          const serviceResult = res?.results?.[serviceResultIndex++];
          return {
            ...item,
            id: normalizeBookmarkId(serviceResult?.id),
            selection: serviceResult?.selection || item.selection,
            status: mapServiceStatus(serviceResult?.status),
          };
        });

        return {
          status: getOverallStatus(itemsWithService, ["OK", "ALREADY_EXISTS"]),
          items: itemsWithService,
        };
      } catch (error) {
        log.error(
          `Failed to add bookmark to userData service. Message: ${error.message}`
        );
        return {
          status: mapServiceErrorStatus(error),
          items: bookmarks.map((bookmark) => ({
            materialId: inputMaterialId(bookmark),
            status: error?.status === 400 ? "FAILED" : "UNKNOWN_ERROR",
          })),
        };
      }
    },
    async deleteBookmarks(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const key = context?.smaug?.gateway?.bookmarks?.key;
      const application = context?.smaug?.gateway?.bookmarks?.app;
      const accessToken = context?.accessToken;
      const { dryRun = false, ids = [] } = args;

      if (!uniqueId || !accessToken) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
          items: ids.map((id) => ({
            id,
            status: "FAILED",
          })),
        };
      }

      if (!key || !application) {
        return {
          status: "ERROR_MISSING_CLIENT_CONFIGURATION",
          items: ids.map((id) => ({
            id,
            status: "FAILED",
          })),
        };
      }

      if (ids.length === 0) {
        throw badUserInput("ids must contain at least one item");
      }

      try {
        const validIdSet = new Set(
          ids.filter((id) => bookmarkIdPattern.test(id))
        );

        if (dryRun) {
          const items = ids.map((id) => ({
            id,
            status: validIdSet.has(id) ? "OK" : "INVALID_ID",
          }));

          return {
            status: getOverallStatus(items),
            items,
          };
        }

        const validIds = ids.filter((id) => validIdSet.has(id));
        if (validIds.length === 0) {
          return {
            status: "FAILED",
            items: ids.map((id) => ({ id, status: "INVALID_ID" })),
          };
        }

        const loader = context.datasources.getLoader(
          "userDataV2DeleteBookmarks"
        );
        const request = { accessToken, bookmarkIds: validIds };
        const res = await loadMutation(loader, request);

        let serviceResultIndex = 0;
        const items = ids.map((id) => {
          if (!validIdSet.has(id)) {
            return { id, status: "INVALID_ID" };
          }

          const serviceResult = res?.results?.[serviceResultIndex++];
          return {
            id,
            materialId: serviceResult?.materialId || null,
            selection: serviceResult?.selection,
            status: mapServiceStatus(serviceResult?.status),
          };
        });

        return {
          status: getOverallStatus(items),
          items,
        };
      } catch (error) {
        log.error(
          `Failed to delete bookmark in userData service. Message: ${error.message}`
        );
        return {
          status: mapServiceErrorStatus(error),
          items: ids.map((id) => ({
            id,
            status: error?.status === 400 ? "FAILED" : "UNKNOWN_ERROR",
          })),
        };
      }
    },
  },
  Bookmarks: {
    hitcount(parent) {
      return parent?.hitcount || 0;
    },
    status(parent) {
      return parent?.status || "OK";
    },
    items(parent) {
      return parent?.items || [];
    },
  },
  BookmarkItem: {
    id(parent) {
      return normalizeBookmarkId(parent.id);
    },
    materialId(parent) {
      return parent.materialId;
    },
    snapshot(parent) {
      if (!parent?.snapshot) {
        return null;
      }

      return {
        ...parent.snapshot,
        _sourceMaterialId: parent?.materialId || null,
      };
    },
    async material(parent, args, context, info) {
      return resolveStoredBookmarkMaterial(parent, context);
    },
    application(parent) {
      return parent.application;
    },
  },

  BookmarksStatusItem: {
    async material(parent, args, context, info) {
      return resolveStoredBookmarkMaterial(parent, context);
    },
  },
};
