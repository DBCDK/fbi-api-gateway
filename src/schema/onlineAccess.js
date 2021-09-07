/**
 * @file Review type definition and resolvers
 *
 */

import { getBaseUrl } from "../utils/utils";

/**
 * The Review type definitions
 * Review is a union type, and may be ReviewInfomedia,
 * ReviewLitteratursiden or ReviewMatVurd
 */
export const typeDef = `
 type UrlReference {
    url: String!
    origin: String!,
    note: String!
  }
  
  type InfomediaReference {
    infomediaId: String!
    type: String!
    error: String
  }
 union OnlineAccess = UrlReference | InfomediaReference
 `;

/**
 * Resolvers for the Review type
 */
export const resolvers = {
  UrlReference: {
    url(parent, args, context, info) {
      return parent.url;
    },
    origin(parent, args, context, info) {
      return getBaseUrl(parent.url);
    },
    async note(parent, args, context, info) {
      return parent.note;
    },
  },
  InfomediaReference: {
    infomediaId(parent, args, context, info) {
      return parent.infomediaId;
    },
    type(parent, args, context, info) {
      return "infomedia";
    },
    error(parent, args, context, info) {
      return parent.error || null;
    },
  },
  OnlineAccess: {
    __resolveType(parent, args, context, info) {
      if (parent.url) {
        return "UrlReference";
      } else if (parent.infomediaId) {
        return "InfomediaReference";
      }
    },
  },
};
