/**
 * @file Review type definition and resolvers
 *
 */

import { getArray } from "../utils/utils";

/**
 * The Review type definitions
 * Review is a union type, and may be ReviewInfomedia,
 * ReviewExternalMedia or ReviewMatVurd
 */
export const typeDef = `
type ReviewInfomedia {
  author: String!
  date: String!
  media: String!
  rating: String!
  reference: [InfomediaReference]
}
type ReviewExternalMedia {
  author: String!
  date: String!
  media: String!
  rating: String!
  url: String!
  alternateUrl: String
}
type ReviewMatVurd {
  author: String!
  date: String!
  all: [TextWithWork!]!
  about: [TextWithWork!]!
  description: [TextWithWork!]!
  evaluation: [TextWithWork!]!
  other: [TextWithWork!]!
}
type TextWithWork {
  name: String! @deprecated(reason: "Use heading instead")
  heading: String!
  "A piece of text mentioning a work at the end."
  text: String!
  "The work the text is refering to. When work is null, the text does not refer to a work."
  work: Work
}
union Review = ReviewInfomedia | ReviewExternalMedia | ReviewMatVurd
`;

/**
 * Resolver for author
 * @param {object} parent
 */
export function resolveAuthor(parent) {
  return (
    getArray(parent, "details.creators.value").map(
      (entry) => entry.name.$
    )[0] || ""
  );
}

/**
 * Resolver for date
 * @param {object} parent
 */
export function resolveDate(parent) {
  return (
    getArray(parent, "details.articleData.article.volume").map(
      (entry) => entry.$
    )[0] ||
    getArray(parent, "admindata.creationDate").map((entry) => entry.$)[0] ||
    ""
  );
}

/**
 * Resolver for media
 * @param {object} parent
 */
function resolveMedia(parent) {
  return (
    getArray(parent, "details.hostPublication.title").map(
      (entry) => entry.$
    )[0] || ""
  );
}

/**
 * Resolver for media
 * @param {object} parent
 */
function resolveRating(parent) {
  return (
    getArray(parent, "details.reviewRatings").map((entry) => entry.$)[0] || ""
  );
}

/**
 * Resolvers for the Review type
 */
export const resolvers = {
  TextWithWork: {
    text(parent, args, context, info) {
      return parent.text.$ || "hest";
    },
    async work(parent, args, context, info) {
      try {
        if (parent.faust && parent.faust.$) {
          const id = `work-of:870970-basis:${parent.faust.$}`;
          return (await context.datasources.workservice.load(id))?.work;
        }
      } catch (e) {
        return null;
      }
    },
  },
  ReviewInfomedia: {
    author: resolveAuthor,
    date: resolveDate,
    media: resolveMedia,
    rating: resolveRating,
    reference(parent, args, context, info) {
      const result = [];

      let infomedia = getArray(parent, "details.infomedia.id");

      if (infomedia) {
        infomedia.forEach((id) => {
          if (id.$) {
            result.push({
              type: "infomedia",
              infomediaId: id.$ || "",
              pid: parent.admindata.pid.$,
            });
          }
        });
      }
      return result.length > 0 ? result : null;
    },
  },
  ReviewExternalMedia: {
    author: resolveAuthor,
    date: resolveDate,
    media: resolveMedia,
    rating: resolveRating,
    url(parent, args, context, info) {
      return (
        getArray(parent, "details.onlineAccess.value.link").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    async alternateUrl(parent, args, context, info) {
      const webarchive = parent?.details?.webarchive?.$;
      if (webarchive) {
        const archives = await context.datasources.moreinfoWebarchive.load(
          parent.admindata.pid.$
        );
        return archives?.[0]?.url;
      }
    },
  },
  ReviewMatVurd: {
    author: resolveAuthor,
    date: resolveDate,
    all(parent, args, context, info) {
      // return all text paragraps in fulltextmatvurd
      const res = [];
      getArray(parent, "details.fulltextmatvurd.value").forEach((entry) => {
        Object.entries(entry).forEach(([name, item]) => {
          if (Array.isArray(item)) {
            item.forEach((item2) => {
              res.push({ name, ...item2 });
            });
          } else {
            res.push({ name, ...item });
          }
        });
      });
      return res;
    },
    about(parent, args, context, info) {
      return getArray(parent, "details.fulltextmatvurd.value.about");
    },
    description(parent, args, context, info) {
      return getArray(parent, "details.fulltextmatvurd.value.description");
    },
    evaluation(parent, args, context, info) {
      return getArray(parent, "details.fulltextmatvurd.value.evaluation");
    },
    other(parent, args, context, info) {
      return getArray(parent, "details.fulltextmatvurd.value.other");
    },
  },
  Review: {
    __resolveType(parent, args, context, info) {
      if (parent.details && parent.details.fulltextmatvurd) {
        return "ReviewMatVurd";
      } else if (parent.details && parent.details.infomedia) {
        return "ReviewInfomedia";
      } else {
        return "ReviewExternalMedia";
      }
    },
  },
};
