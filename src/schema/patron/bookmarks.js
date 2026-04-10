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
      Number of failed bookmark additions (e.g., due to duplicates or validation errors).
      """
      failed: Int!
    }

    type DeleteBookmarksResponse {
      """
      The number of bookmarks that were successfully deleted.
      """
      status: BookmarksStatusEnum!
      
      """
      Number of failed bookmark deletions (e.g., due to non-existent bookmark IDs).
      """
      failed: Int!
    }

    enum BookmarksStatusEnum {
      OK
      ERROR_UNAUTHENTICATED_TOKEN
      ERROR
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
          hitcount: res?.result?.length || 0,
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
          failed: bookmarks.length,
        };
      }

      try {
        const data = await Promise.all(
          bookmarks.map(async ({ materialId }) => {
            const isWork = materialId?.startsWith("work-of:");
            const props = isWork ? { id: materialId } : { pid: materialId };
            const obj = await resolveMaterial(props, context);

            if (obj) {
              console.log("obj", obj);

              return {
                materialId,
                workId: obj?.workId,
                title: obj?.titles?.main?.[0],
                creator: obj?.creators?.persons?.[0]?.display,
                materialType: obj?.workTypes?.[0], // THIS prop DOES NOT MAKE SENSE FOR ME?
                agencyId,
                clientId,
              };
            }
          })
        );

        console.log("data", data);

        // Early return for dry run to avoid unnecessary calls to userData service
        if (dryRun) {
          return {
            status: "OK",
            failed: 0,
          };
        }

        const res = await context.datasources
          .getLoader("userDataAddBookmarks")
          .load({ uniqueId, bookmarks: data });

        return res;
      } catch (error) {
        // @TODO log
        log.error(
          `Failed to add bookmark to userData service. Message: ${error.message}`
        );
        return { bookMarkId: 0 };
      }
    },
    async deleteBookmarks(parent, args, context, info) {
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;

        if (!uniqueId) {
          throw new Error("Not authorized");
        }

        if (isCPRNumber(uniqueId)) {
          throw new Error("User not found in CULR");
        }

        const res = await context.datasources
          .getLoader("userDataDeleteBookmark")
          .load({ uniqueId, bookmarkIds: args.bookmarkIds });

        return res;
      } catch (error) {
        log.error(
          `Failed to delete bookmark in userData service. Message: ${error.message}`
        );
        return 0;
      }
    },
  },
  Bookmarks: {
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
