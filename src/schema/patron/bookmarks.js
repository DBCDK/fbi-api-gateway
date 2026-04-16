/**
 * @file This file handles
 *
 */

import { log } from "dbc-node-logger";
import { resolveMaterial } from "../../utils/utils";

// Helper function to determine overall status based on individual item statuses
function getOverallStatus(items = []) {
  if (items.length === 0) return "OK";
  const allOk = items.every((d) => d.status === "OK");
  if (allOk) return "OK";
  const allFailed = items.every((d) => d.status !== "OK");
  return allFailed ? "FAILED" : "PARTIALLY_FAILED";
}

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
        addBookmarks(bookmarks: [BookmarksInput!]! dryRun: Boolean): AddBookmarksResponse

        """
        Deletes one or more bookmarks for the patron. If a bookmark does not exist, it will be ignored.
        """
        deleteBookmarks(ids: [Int!]! dryRun: Boolean): DeleteBookmarksResponse
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
        id: Int!

        """
        The bibliographic record identifier associated with the bookmark
        """
        material: MaterialUnion!

        """
        creation date of the bookmark
        """
        createdAt: DateTimeScalar!

        """
        The application the bookmark belongs to
        """
        application: BookmarksApplicationEnum!
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
      The unique identifier for the newly created bookmark.
      """
      status: BookmarksOverallStatusEnum!

      """
      A list of materials for which bookmark addition failed.
      """
      items: [BookmarksStatusItem!]!
    }

    type DeleteBookmarksResponse {
      """
      The number of bookmarks that were successfully deleted.
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
      id: Int

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
        if (!key || !application) {
          return {
            result: [],
            status: "ERROR_MISSING_CLIENT_CONFIGURATION",
          };
        }

        const res = await context.datasources
          .getLoader("userDataGetBookMarks")
          .load({ uniqueId, orderBy, agencyId, key, application });

        return {
          result: res?.result || [],
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
      const agencyId = context.profile.agency;
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
            status: getOverallStatus(items),
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
              id: existingBookmark.bookmarkId || existingBookmark.id || null,
              status: "ALREADY_EXISTS",
            };
          }

          const addedBookmark = bookmarksAdded.find(
            (b) => b.materialId === item.materialId
          );
          if (addedBookmark) {
            return {
              ...item,
              id: addedBookmark.bookmarkId || addedBookmark.id || null,
            };
          }

          return { ...item, status: "UNKNOWN_ERROR" };
        });

        return {
          status: getOverallStatus(itemsWithService),
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
        if (dryRun) {
          return {
            status: "OK",
            items: ids.map((id) => ({
              id,
              status: "OK",
            })),
          };
        }

        const res = await context.datasources
          .getLoader("userDataDeleteBookmark")
          .load({ uniqueId, bookmarkIds: ids, agencyId, key, application });

        const deletedCount = res?.IdsDeletedCount ?? 0;
        const requestedCount = ids.length;

        const allDeleted = deletedCount === requestedCount;
        const nothingDeleted = deletedCount === 0;

        const items = ids.map((id) => ({
          id,
          status: allDeleted ? "OK" : "UNKNOWN_ERROR",
        }));

        let status = "PARTIALLY_FAILED";
        if (nothingDeleted) {
          status = "FAILED";
        } else if (allDeleted) {
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
      return parent.bookmarkId;
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

      const studeSogAgencies = [
        "872960",
        "874260",
        "872320",
        "875140",
        "861640",
        "872600",
      ];

      if (studeSogAgencies.includes(parent?.agencyId)) {
        return "STUDIESOEG";
      }

      return "UNKNOWN";
    },
  },

  AddBookmarksResponse: {
    async status(parent, args, context, info) {
      if (parent.status) {
        return parent.status;
      }
    },
    async items(parent, args, context, info) {
      return parent.items || [];
    },
  },
  DeleteBookmarksResponse: {
    async status(parent, args, context, info) {
      if (parent.status) {
        return parent.status;
      }
    },
    async items(parent, args, context, info) {
      return parent.items || [];
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
