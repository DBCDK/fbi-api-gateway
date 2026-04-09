/**
 * @file This file handles
 *
 */

import { log } from "dbc-node-logger";
import { resolveManifestation, resolveWork } from "../../utils/utils";

export const typeDef = `
    extend type Patron {
        """
        bookmarks blah blah ...
        """
        bookmarks: Bookmarks!
    }

    type Bookmarks {
        """
        The total number of bookmarks for the patron
        """
        hitcount: Int!

        """
        The list of bookmarks for the patron
        """
        items(orderBy: OrderBookmarksByEnum offset: Int limit: PaginationLimitScalar): [BookmarkItem!]
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
        source: BookmarkSourceEnum!
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
    enum BookmarkSourceEnum {
        BIBLIOTEKDK
        STUDIESOEG
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
  Bookmarks: {
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

      if (materialId?.startsWith("work-of:")) {
        return resolveWork({ id: materialId }, context);
      }

      return resolveManifestation({ pid: materialId }, context);
    },

    source(parent) {
      // Does not exist in database yet, but if it did, we would return it here
      if (parent.source) {
        return parent.source;
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
