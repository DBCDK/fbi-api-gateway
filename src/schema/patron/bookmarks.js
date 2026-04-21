/**
 * @file This file handles "patron" requests, specifically related to bookmarks.
 *
 */

import { log } from "dbc-node-logger";
import { resolveMaterial } from "../../utils/utils";
import {
  normalizeBookmarkId,
  getOverallStatus,
  parseLegacyBookmarkId,
} from "./utils";

export const typeDef = `
    extend type Patron {
        """
        Retrieves the list of bookmarks for the patron, including pagination and sorting options.
        """
        bookmarks: Bookmarks!
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
        items(orderBy: OrderBookmarksByEnum offset: Int limit: PaginationLimitScalar): [BookmarkItem!]!
    }

    type BookmarkItem {
        """
        The unique identifier for the bookmark
        """
        id: String!

        """
        The unique identifier for the material this bookmark points to.
        """
        materialId: String

        """
        The bibliographic record associated with the bookmark, if it can still be resolved.
        """
        material: MaterialUnion

        """
        Stored metadata captured when the bookmark was created.
        """
        snapshot: BookmarkSnapshot

        """
        creation date of the bookmark
        """
        createdAt: DateTimeScalar!

        """
        The application the bookmark belongs to
        """
        application: BookmarksApplicationEnum!
    }

    type BookmarkSnapshot {
        """
        Stored work id from when the bookmark was created.
        """
        workId: String

        """
        Stored title from when the bookmark was created.
        """
        title: String

        """
        Stored creator from when the bookmark was created.
        """
        creator: String

        """
        Stored material type from when the bookmark was created.
        """
        materialType: String

        """
        Stored work type from when the bookmark was created.
        """
        workType: String
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

    enum BookmarksApplicationEnum {
        BIBLIOTEKDK
        STUDIESOEG
        UNKNOWN
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
      const agencyId = context?.profile?.agency;
      const key = context?.smaug?.gateway?.bookmarks?.key;
      const application = context?.smaug?.gateway?.bookmarks?.app;
      const orderBy = "CREATEDAT";

      try {
        if (!uniqueId) {
          return {
            result: [],
            status: "ERROR_UNAUTHENTICATED_TOKEN",
          };
        }

        if (!key || !application) {
          return {
            result: [],
            status: "ERROR_MISSING_CLIENT_CONFIGURATION",
          };
        }

        const res = await context.datasources
          .getLoader("userDataGetBookMarks")
          .load({ uniqueId, orderBy, agencyId, key, application });

        const result = (res?.result || []).filter((bookmark) => {
          const bookmarkId = normalizeBookmarkId(
            bookmark?.bookmarkId ?? bookmark?.id
          );

          if (bookmarkId) {
            return true;
          }

          log.error("Ignoring bookmark without id from userData service", {
            materialId: bookmark?.materialId,
            createdAt: bookmark?.createdAt,
            agencyId: bookmark?.agencyId,
          });

          return false;
        });

        return {
          result,
          status: "OK",
        };
      } catch (error) {
        log.error(
          `Failed to get bookmarks from userData service. Message: ${error.message}`
        );
        return { result: [], status: "FAILED" };
      }
    },
  },
  PatronMutation: {
    async addBookmarks(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const agencyId = context?.profile?.agency;
      const clientId = context?.smaug?.app?.clientId;
      const key = context?.smaug?.gateway?.bookmarks?.key;
      const application = context?.smaug?.gateway?.bookmarks?.app;

      const { dryRun = false, bookmarks = [] } = args;

      if (!uniqueId) {
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
            workId: obj?.workId,
            title: obj?.titles?.main?.[0],
            creator: obj?.creators?.persons?.[0]?.display,
            materialType: obj?.materialTypes?.[0]?.specific?.code || null,
            workType: obj?.workTypes?.[0] || null,
          }));

        // Early return for dry run to avoid unnecessary calls to userData service
        if (dryRun) {
          return {
            status: getOverallStatus(items, ["OK", "ALREADY_EXISTS"]),
            items,
          };
        }

        //  Add bookmarks to userData service
        const res = await context.datasources
          .getLoader("userDataAddBookmarks")
          .load({
            uniqueId,
            bookmarks: data,
            agencyId,
            clientId,
            key,
            application,
          });

        // Check the response from userData service to determine if any bookmarks were not added due to already existing or not found
        const payload = res?.body || res;
        const { bookmarksAdded = [], bookmarksAlreadyExists = [] } = payload;

        const itemsWithService = items.map((item) => {
          if (item.status !== "OK") return item;

          const existingBookmark = bookmarksAlreadyExists.find(
            (b) => b.materialId === item.materialId
          );
          if (existingBookmark) {
            return {
              ...item,
              id: normalizeBookmarkId(
                existingBookmark.bookmarkId || existingBookmark.id
              ),
              status: "ALREADY_EXISTS",
            };
          }

          const addedBookmark = bookmarksAdded.find(
            (b) => b.materialId === item.materialId
          );
          if (addedBookmark) {
            return {
              ...item,
              id: normalizeBookmarkId(
                addedBookmark.bookmarkId || addedBookmark.id
              ),
            };
          }

          return { ...item, status: "UNKNOWN_ERROR" };
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
          status: "FAILED",
          items: bookmarks.map(({ materialId }) => ({
            materialId,
            status: "UNKNOWN_ERROR",
          })),
        };
      }
    },
    async deleteBookmarks(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const agencyId = context?.profile?.agency;
      const key = context?.smaug?.gateway?.bookmarks?.key;
      const application = context?.smaug?.gateway?.bookmarks?.app;
      const { dryRun = false, ids = [] } = args;

      if (!uniqueId) {
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

      try {
        // Delete still uses legacy integer ids downstream for now.
        const parsedIds = ids.map((id) => ({
          id,
          parsedId: parseLegacyBookmarkId(id),
        }));
        const invalidIds = parsedIds.filter(
          ({ parsedId }) => parsedId === null
        );
        const invalidIdSet = new Set(invalidIds.map(({ id }) => id));
        const validIds = parsedIds
          .filter(({ parsedId }) => parsedId !== null)
          .map(({ parsedId }) => parsedId);

        if (dryRun) {
          const items = ids.map((id) => ({
            id,
            status: invalidIdSet.has(id) ? "FAILED" : "OK",
          }));

          return {
            status: getOverallStatus(items),
            items,
          };
        }

        if (validIds.length === 0) {
          return {
            status: "FAILED",
            items: ids.map((id) => ({
              id,
              status: "FAILED",
            })),
          };
        }

        const res = await context.datasources
          .getLoader("userDataDeleteBookmark")
          .load({
            uniqueId,
            bookmarkIds: validIds,
            agencyId,
            key,
            application,
          });

        const deletedCount = res?.IdsDeletedCount ?? 0;
        const requestedCount = validIds.length;

        const allDeleted = deletedCount === requestedCount;
        const nothingDeleted = deletedCount === 0;

        const validStatus = allDeleted ? "OK" : "UNKNOWN_ERROR";
        const items = ids.map((id) => {
          return {
            id,
            status: invalidIdSet.has(id) ? "FAILED" : validStatus,
          };
        });

        // Invalid ids should still surface as item failures even if other deletes succeed.
        let status = "PARTIALLY_FAILED";
        if (nothingDeleted && invalidIds.length === 0) {
          status = "FAILED";
        } else if (allDeleted && invalidIds.length === 0) {
          status = "OK";
        }

        return {
          status,
          items,
        };
      } catch (error) {
        log.error(
          `Failed to delete bookmark in userData service. Message: ${error.message}`
        );
        return {
          status: "FAILED",
          items: ids.map((id) => ({
            id,
            status: "UNKNOWN_ERROR",
          })),
        };
      }
    },
  },
  Bookmarks: {
    hitcount(parent) {
      return parent?.result?.length || 0;
    },
    status(parent) {
      return parent?.status || "OK";
    },
    items(parent, args, context, info) {
      const { orderBy = "CREATEDAT_DESC", offset = 0, limit = 10 } = args;

      const sortedItems = [...(parent.result || [])].sort((a, b) => {
        switch (orderBy) {
          case "CREATEDAT_ASC":
            return new Date(a.createdAt) - new Date(b.createdAt);

          case "CREATEDAT_DESC":
            return new Date(b.createdAt) - new Date(a.createdAt);

          case "TITLE_ASC":
            return (a.title || "").localeCompare(b.title || "", "da");

          case "TITLE_DESC":
            return (b.title || "").localeCompare(a.title || "", "da");

          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });

      return sortedItems.slice(offset, offset + limit);
    },
  },
  BookmarkItem: {
    id(parent) {
      return normalizeBookmarkId(parent.bookmarkId ?? parent.id);
    },
    materialId(parent) {
      return parent?.materialId || null;
    },
    snapshot(parent) {
      if (
        !parent?.materialId &&
        !parent?.workId &&
        !parent?.title &&
        !parent?.creator &&
        !parent?.materialType &&
        !parent?.workType
      ) {
        return null;
      }

      return {
        workId: parent?.workId || null,
        title: parent?.title || null,
        creator: parent?.creator || null,
        materialType: parent?.materialType || null,
        workType: parent?.workType || null,
      };
    },
    async material(parent, args, context, info) {
      const materialId = parent?.materialId;
      const isWork = materialId?.startsWith("work-of:");
      const props = isWork ? { id: materialId } : { pid: materialId };

      return await resolveMaterial(props, context);
    },
    application(parent) {
      if (parent?.application) {
        return parent.application;
      }

      // Get application from agency as fallback for older bookmarks that don't have application field
      if (parent?.agencyId === "190101") {
        return "BIBLIOTEKDK";
      }

      const studiesoegAgencyIds = [
        "872960",
        "874260",
        "872320",
        "875140",
        "861640",
        "872600",
      ];

      if (studiesoegAgencyIds.includes(parent?.agencyId)) {
        return "STUDIESOEG";
      }

      return "UNKNOWN";
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
