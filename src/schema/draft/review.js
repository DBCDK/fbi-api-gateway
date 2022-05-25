import { orderBy, uniqBy } from "lodash";
import { getArray } from "../../utils/utils";

export const typeDef = `
interface Draft_Review {
  author: String
  date: String
}

type Draft_ExternalReview implements Draft_Review {
  author: String
  date: String
  rating: String
  urls: [Draft_URL!]!
}

type Draft_InfomediaReview implements Draft_Review {
  author: String
  date: String
  origin: String
  rating: String
  id: String!
}

type Draft_LibrariansReview implements Draft_Review {
  author: String
  date: String
  sections: [TextWithWork!]!
  
  """ This is a pid """
  id: String!
}

extend type Draft_Work {
  reviews: [Draft_Review!]!
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
  Draft_InfomediaReview: {
    id(parent, args, context, info) {
      return parent.infomediaId;
    },
  },
  Draft_LibrariansReview: {
    id(parent, args, context, info) {
      return parent.pid;
    },
  },
  Draft_Work: {
    async reviews(parent, args, context, info) {
      let reviews = (
        await Promise.all(
          parent.relations
            .filter((rel) => rel.type === "review")
            .map((review) => context.datasources.openformat.load(review.id))
        )
      ).map((review) => ({
        author: resolveAuthor(review),
        date: resolveDate(review),
        media: resolveMedia(review),
        rating: resolveRating(review),
        urls: getArray(review, "details.onlineAccess.value.link").map(
          (entry) => entry.$
        ),
        infomediaId: getArray(review, "details.infomedia.id")?.map?.(
          (entry) => entry.$
        )?.[0],
        pid: review?.admindata?.pid?.$,
        __typename: review?.details?.fulltextmatvurd
          ? "Draft_LibrariansReview"
          : review?.details?.infomedia
          ? "Draft_InfomediaReview"
          : "Draft_ExternalReview",
      }));
      reviews = orderBy(reviews, "date", "desc");
      reviews = uniqBy(reviews, "author");
      return reviews;
    },
  },
};
