/**
 * @file This file handles
 *
 */

import { log } from "dbc-node-logger";
import {
  resolveManifestation,
  resolveMaterial,
  resolveWork,
} from "../../utils/utils";

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
        The list of bookmarks for the patron
        """
        items(application: BookmarksApplicationEnum, orderBy: OrderBookmarksByEnum offset: Int limit: PaginationLimitScalar): [BookmarkItem!]!
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
        The source of the bookmark
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

    """
    The source of the bookmark, indicating which system it was created in.
    """
    enum BookmarksApplicationEnum {
        BIBLIOTEKDK
        STUDIESOEG
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
      status: BookmarksStatusEnum!

      """
      A list of materials for which bookmark addition failed.
      """
      failed: [BookmarksFailedItem!]!
    }

    type DeleteBookmarksResponse {
      """
      The number of bookmarks that were successfully deleted.
      """
      status: BookmarksStatusEnum!
      
      """
      Number of failed bookmark deletions (e.g., due to non-existent bookmark IDs).
      """
      failed: [BookmarksFailedItem!]!
    }

    type BookmarksFailedItem {
      """
      The unique identifier for the material for which bookmark addition failed (e.g., a PID or work ID).
      """
      materialId: String!
      """
      The material for which bookmark addition failed.
      """
      material: MaterialUnion

      """
      The reason why the bookmark addition failed.
      """
      reason: FailedBookmarkReasonEnum!
    }

    enum BookmarksStatusEnum {
      OK
      FAILED
      ERROR_UNAUTHENTICATED_TOKEN
    }

    enum FailedBookmarkReasonEnum {
      ALREADY_EXISTS
      NOT_FOUND
      UNKNOWN_ERROR
    }

    `;

export const resolvers = {
  Patron: {
    async bookmarks(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const agencyId = context?.profile?.agency; // studiesøg/bibliotek.dk filtered bookmarks
      const orderBy = "CREATEDAT";

      try {
        const res = await context.datasources
          .getLoader("userDataGetBookMarks")
          .load({ uniqueId, orderBy, agencyId });

        return {
          result: res?.result || [],
        };
      } catch (error) {
        log.error(
          `Failed to get bookmarks from userData service. Message: ${error.message}`
        );
        return { result: [], hitcount: 0 };
      }
    },
  },
  PatronMutation: {
    async addBookmarks(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const agencyId = context.profile.agency;
      const clientId = context?.smaug?.app?.clientId;

      const { dryRun = false, bookmarks = [] } = args;

      if (!uniqueId) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
          failedItems: bookmarks.map(({ materialId }) => ({
            materialId,
            reason: "UNKNOWN_ERROR",
          })),
        };
      }

      const notFound = [];

      try {
        const data = await Promise.all(
          bookmarks.map(async ({ materialId }) => {
            const isWork = materialId?.startsWith("work-of:");
            const props = isWork ? { id: materialId } : { pid: materialId };
            const obj = await resolveMaterial(props, context);

            if (obj) {
              return {
                materialId,
                workId: obj?.workId,
                title: obj?.titles?.main?.[0],
                creator: obj?.creators?.persons?.[0]?.display,
                materialType: obj?.materialTypes?.[0]?.specific?.code || null,
                workType: obj?.workTypes?.[0] || null,
              };
            }

            notFound.push({
              materialId,
              reason: "NOT_FOUND",
            });
          })
        );

        // Filter out any null or undefined values from the resolved bookmarks
        const filteredData = data.filter((item) => item);

        // Early return for dry run to avoid unnecessary calls to userData service
        if (dryRun) {
          return {
            status: "OK",
            failedItems: [],
          };
        }

        //  Add bookmarks to userData service
        const res = await context.datasources
          .getLoader("userDataAddBookmarks")
          .load({ uniqueId, bookmarks: filteredData, agencyId, clientId });

        // Check the response from userData service to determine if any bookmarks were not added due to already existing or not found
        const { bookmarksAdded, bookmarksAlreadyExists } = res;

        // If the number of bookmarks added does not match the number of bookmarks requested, determine which ones failed and why
        if (bookmarks.length !== bookmarksAdded.length) {
          const alreadyExist = bookmarksAlreadyExists?.map((item) => ({
            materialId: item.materialId,
            reason: "ALREADY_EXISTS",
          }));

          return {
            status: "FAILED",
            failedItems: [...notFound, ...alreadyExist],
          };
        }

        return { status: "OK", failedItems: [] };
      } catch (error) {
        log.error(
          `Failed to add bookmark to userData service. Message: ${error.message}`
        );
        return {
          status: "FAILED",
          failedItems: bookmarks.map(({ materialId }) => ({
            materialId,
            reason: "UNKNOWN_ERROR",
          })),
        };
      }
    },
    async deleteBookmarks(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const { dryRun = false, ids = [] } = args;

      if (!uniqueId) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
          failedItems: ids.map((id) => ({
            materialId: String(id),
            reason: "UNKNOWN_ERROR",
          })),
        };
      }

      try {
        if (dryRun) {
          return { status: "OK", failedItems: [] };
        }

        const res = await context.datasources
          .getLoader("userDataDeleteBookmark")
          .load({ uniqueId, bookmarkIds: ids });

        console.log("########## deleteBookmarks res", res);

        const deletedCount = res?.IdsDeletedCount ?? 0;
        const requestedCount = ids.length;

        if (deletedCount !== requestedCount) {
          return {
            status: "FAILED",
            failedItems: ids.map((id) => ({
              materialId: String(id),
              reason: "UNKNOWN_ERROR",
            })),
          };
        }

        return {
          status: "OK",
          failedItems: [],
        };
      } catch (error) {
        log.error(
          `Failed to delete bookmark in userData service. Message: ${error.message}`
        );
        return {
          status: "FAILED",
          failedItems: ids.map((id) => ({
            materialId: String(id),
            reason: "UNKNOWN_ERROR",
          })),
        };
      }
    },
  },
  Bookmarks: {
    hitcount(parent) {
      return parent?.result?.length || 0;
    },
    items(parent, args, context, info) {
      const {
        application,
        orderBy = "CREATEDAT_DESC",
        offset = 0,
        limit = 10,
      } = args;

      let filteredItems = parent.result || [];

      if (application) {
        const agencyIdToSourceMap = {
          190101: "BIBLIOTEKDK",
          190102: "STUDIESOEG",
        };

        filteredItems = filteredItems.filter((item) => {
          const itemSource =
            item.application || agencyIdToSourceMap[item.agencyId];
          return itemSource === application;
        });
      }

      const sortedItems = [...filteredItems].sort((a, b) => {
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
      // Does not exist in database yet, but if it did, we would return it here
      if (parent.application) {
        return parent.application;
      }

      // fallabck to old agencyId field for backwards compatibility until we have source in database
      if (parent.agencyId === "190101") {
        return "BIBLIOTEKDK";
      } else {
        return "STUDIESOEG";
      }
    },
  },

  AddBookmarksResponse: {
    async status(parent, args, context, info) {
      if (parent.status) {
        return parent.status;
      }
    },
    async failed(parent, args, context, info) {
      return parent.failedItems || [];
    },
  },
  DeleteBookmarksResponse: {
    async status(parent, args, context, info) {
      if (parent.status) {
        return parent.status;
      }
    },
    async failed(parent, args, context, info) {
      return parent.failedItems || [];
    },
  },

  BookmarksFailedItem: {
    async material(parent, args, context, info) {
      console.log("########## parent.material", parent);

      const materialId = parent.materialId;
      const isWork = materialId?.startsWith("work-of:");
      const props = isWork ? { id: materialId } : { pid: materialId };
      const material = await resolveMaterial(props, context);

      return material;
    },
    async reason(parent, args, context, info) {
      if (parent.reason) {
        return parent.reason;
      }
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
