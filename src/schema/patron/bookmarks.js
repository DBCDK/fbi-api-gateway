/**
 * @file This file handles "patron" requests, specifically related to bookmarks.
 *
 */

import { log } from "dbc-node-logger";
import { resolveMaterial } from "../../utils/utils";
import { normalizeBookmarkId, getOverallStatus } from "./utils";

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

export const typeDef = `
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
        material: MaterialUnion

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

    """
    Union type for different material types that can be bookmarked
    """
    union MaterialUnion = Work | Manifestation

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
      """
      The unique identifier for the material being bookmarked (e.g., a PID or work ID).
      """
      materialId: String!
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
      The material for which bookmark addition failed.
      """
      material: MaterialUnion
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
          items: bookmarks.map(({ materialId }) => ({
            materialId,
            status: "FAILED",
          })),
        };
      }

      if (!key || !application) {
        return {
          status: "ERROR_MISSING_CLIENT_CONFIGURATION",
          items: bookmarks.map(({ materialId }) => ({
            materialId,
            status: "FAILED",
          })),
        };
      }

      if (bookmarks.length === 0) {
        return { status: "FAILED", items: [] };
      }

      try {
        const resolved = await Promise.all(
          bookmarks.map(async ({ materialId }) => {
            const isWork = materialId?.startsWith("work-of:");
            const props = isWork ? { id: materialId } : { pid: materialId };
            const obj = await resolveMaterial(props, context);

            return { materialId, obj };
          })
        );

        const items = resolved.map(({ materialId, obj }) => ({
          materialId,
          status: obj ? "OK" : "NOT_FOUND",
        }));

        const data = resolved
          .filter(({ obj }) => obj)
          .map(({ materialId, obj }) => ({
            materialId,
            snapshot: {
              workId: obj?.workId || null,
              title: obj?.titles?.main?.[0] || null,
              creator: obj?.creators?.persons?.[0]?.display || null,
              materialType: obj?.materialTypes?.[0]?.specific?.code || null,
              workType: obj?.workTypes?.[0] || null,
            },
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
          items: bookmarks.map(({ materialId }) => ({
            materialId,
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
        return { status: "FAILED", items: [] };
      }

      try {
        const validIdSet = new Set(
          ids.filter((id) => bookmarkIdPattern.test(id))
        );

        if (dryRun) {
          const items = ids.map((id) => ({
            id,
            status: validIdSet.has(id) ? "OK" : "FAILED",
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
            items: ids.map((id) => ({ id, status: "FAILED" })),
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
            return { id, status: "FAILED" };
          }

          const serviceResult = res?.results?.[serviceResultIndex++];
          return {
            id,
            materialId: serviceResult?.materialId || null,
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
      const materialId = parent?.materialId;

      if (!materialId) {
        return null;
      }

      const isWork = materialId?.startsWith("work-of:");
      const props = isWork ? { id: materialId } : { pid: materialId };

      return await resolveMaterial(props, context);
    },
    application(parent) {
      return parent.application;
    },
  },

  BookmarksStatusItem: {
    async material(parent, args, context, info) {
      const materialId = parent.materialId;
      if (!materialId) {
        return null;
      }
      const isWork = materialId?.startsWith("work-of:");
      const props = isWork ? { id: materialId } : { pid: materialId };
      const material = await resolveMaterial(props, context);

      return material;
    },
  },

  MaterialUnion: {
    __resolveType(obj) {
      if (!obj) return null;
      if (obj.__typename) return obj.__typename;
      if (obj.pid) return "Manifestation";
      if (obj.manifestations) return "Work";
      return null;
    },
  },
};
