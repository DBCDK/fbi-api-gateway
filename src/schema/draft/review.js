import { orderBy, uniqBy } from "lodash";
import { getArray, getBaseUrl, resolveWork } from "../../utils/utils";
import { workToJed } from "./draft_utils";
import * as consts from "./FAKE";

const reviews = {
  heading: {
    ALL: { da: null },
    ABOUT: { da: "Kort om bogen" },
    DESCRIPTION: { da: "Beskrivelse" },
    EVALUATION: { da: "Vurdering" },
    OTHER: { da: "Andre bøger om samme emne" },
    LIBRARY: { da: null },
    USE: { da: null },
    OLDDESCRIPTION: { da: null },
    COMPARE: { da: null },
    CONCLUSION: { da: null },
  },
};

export const typeDef = `
enum LibrariansReviewSectionCode {
  ALL
  ABOUT
  DESCRIPTION
  EVALUATION
  OTHER
  LIBRARY
  USE
  OLDDESCRIPTION
  COMPARE
  CONCLUSION
}
type LibrariansReviewSection {

  """
  a code indicating the content type of the section
  """
  code: LibrariansReviewSectionCode!

  """
  The heading of the section
  """
  heading: String

  """
  A piece of text, maybe mentioning a work at the end.
  """
  text: String!

  """
  The work the text is refering to. When work is null, the text does not refer to a work.
  """
  work: Work
}
interface Review {
  author: String
  date: String
}

type ExternalReview implements Review {
  author: String
  date: String
  rating: String
  urls: [AccessUrl!]!
}

type InfomediaReview implements Review {
  author: String
  date: String
  origin: String
  rating: String
  id: String!
}

type LibrariansReview implements Review {
  author: String
  date: String
  sections: [LibrariansReviewSection!]!
  
  """ This is a pid """
  id: String!
}

extend type Work {
  reviews: [Review!]!
}
`;

/**
 * Resolver for author
 * @param {object} parent
 */
function resolveAuthor(parent) {
  return getArray(parent, "details.creators.value").map(
    (entry) => entry.name.$
  )[0];
}

/**
 * Resolver for date
 * @param {object} parent
 */
function resolveDate(parent) {
  return (
    getArray(parent, "details.articleData.article.volume").map(
      (entry) => entry.$
    )[0] ||
    getArray(parent, "admindata.creationDate").map((entry) => entry.$)[0]
  );
}

/**
 * Resolver for media
 * @param {object} parent
 */
function resolveMedia(parent) {
  return getArray(parent, "details.hostPublication.title").map(
    (entry) => entry.$
  )[0];
}

/**
 * Resolver for media
 * @param {object} parent
 */
function resolveRating(parent) {
  return getArray(parent, "details.reviewRatings").map((entry) => entry.$)[0];
}

export const resolvers = {
  InfomediaReview: {
    id(parent, args, context, info) {
      return parent.infomediaId;
    },
  },
  LibrariansReview: {
    id(parent, args, context, info) {
      return parent.pid;
    },
    sections(parent) {
      return (
        parent?.fulltextmatvurd
          ?.map?.(([code, entry]) => {
            code = code.toUpperCase();
            return {
              code,
              heading: reviews.heading[code]?.da,
              text: entry?.text?.$ || "",
              faust: entry?.faust?.$,
            };
          })
          .filter((entry) => !!reviews.heading[entry.code]) || []
      );
    },
  },
  LibrariansReviewSection: {
    async work(parent, args, context, info) {
      if (parent.faust) {
        return resolveWork({ faust: parent.faust }, context);
      }
    },
  },
  Work: {
    async reviews(parent, args, context, info) {
      // We still use old workservice for relations
      const work = await context.datasources
        .getLoader("workservice")
        .load({ workId: parent.workId, profile: context.profile });

      if (!work?.relations) {
        return [];
      }
      let reviews = (
        await Promise.all(
          work.relations
            .filter((rel) => rel.type === "review")
            .map((review) =>
              context.datasources.getLoader("openformat").load(review.id)
            )
        )
      )
        .filter((review) => !!review)
        .map((review) => {
          const parsed = {
            author: resolveAuthor(review),
            date: resolveDate(review),
            media: resolveMedia(review),
            rating: resolveRating(review),
            urls: getArray(review, "details.onlineAccess.value.link")
              .map((entry) => entry.$)
              ?.map((url) => ({ origin: getBaseUrl(url), url })),
            infomediaId: getArray(review, "details.infomedia.id")?.map?.(
              (entry) => entry.$
            )?.[0],
            org: review,
            fulltextmatvurd:
              review?.details?.fulltextmatvurd?.value &&
              Object.entries(review?.details?.fulltextmatvurd?.value),
            pid: review?.admindata?.pid?.$,
            __typename: review?.details?.fulltextmatvurd
              ? "LibrariansReview"
              : review?.details?.infomedia
              ? "InfomediaReview"
              : review?.urls?.length > 0
              ? "ExternalReview"
              : null,
          };

          parsed.__typename = review?.details?.fulltextmatvurd
            ? "LibrariansReview"
            : review?.details?.infomedia
            ? "InfomediaReview"
            : parsed.urls?.length > 0
            ? "ExternalReview"
            : null;

          return parsed;
        })
        .filter((review) => review.__typename);
      reviews = orderBy(reviews, "date", "desc");
      reviews = uniqBy(reviews, "author");
      return reviews;
    },
  },
};
