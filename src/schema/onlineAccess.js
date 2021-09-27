/**
 * @file online access definition and resolvers
 *
 */

import { getBaseUrl } from "../utils/utils";

/**
 * The online access definitions
 * online access is a union type, and may be an url- or infomedia-reference
 */
export const typeDef = `
 type UrlReference {
    url: String!
    origin: String!,
    note: String!
  }
  
  type InfomediaReference {
    infomediaId: String!
    pid: String!
    error: String
  }
  
  type WebArchive {
    type: String!
    url: String!
    pid: String!
  }

  type DigitalCopy {
    issn: String!
  }
 union OnlineAccess = UrlReference | InfomediaReference | WebArchive | DigitalCopy
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
    error(parent, args, context, info) {
      return parent.error || null;
    },
  },
  WebArchive: {
    type(parent, args, context, info) {
      return parent.type;
    },
    url(parent, args, context, info) {
      return parent.url;
    },
    pid(parent, args, context, info) {
      return parent.pid;
    },
  },
  OnlineAccess: {
    __resolveType(parent, args, context, info) {
      if (parent.type === "webArchive") {
        return "WebArchive";
      } else if (parent.url) {
        return "UrlReference";
      } else if (parent.issn) {
        return "DigitalCopy";
      } else if (parent.infomediaId) {
        return "InfomediaReference";
      }
    },
  },
};
