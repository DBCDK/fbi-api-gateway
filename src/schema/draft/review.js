import { orderBy, uniqBy } from "lodash";
import {
  getArray,
  getBaseUrl,
  resolveManifestation,
  resolveWork,
} from "../../utils/utils";
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

type WorkReview {
  """
  Author of the review
  """
  author: String

  """
  Date of the review in the format YYYY-MM-DD
  """
  date: String

  """
  When this is not null, the review can be retrieved from infomedia using the infomediaId
  """
  infomediaId: String

  """
  When this is not null, this review is created by a librarian, 
  and the sections of the review are available here
  """
  librariansReview: [LibrariansReviewSection!]

  """
  The origin of review. E.g. 'Politiken'
  """
  origin: String

  """
  When this is not null, the review is located in a periodica
  """
  periodica: PeriodicaReviewDetails

  """
  The pid of the review
  """
  pid: String!

  """
  The authors rating of the work. E.g '5/6'
  """
  rating: String

  """
  This may contain URL's where the review can be read
  """
  urls: [AccessUrl!]!
}

type PeriodicaReviewDetails {
  """
  Specifies the volume of the periodica where the review is located
  """
  volume: String

  """
  Specifies which pages of the volume the review is located
  """
  pages: String

  """
  A reference to the host publication
  """
  hostPublication: Work
}

extend type Work {
  """
  The new reviews
  """
  workReviews: [WorkReview!]! @deprecated(reason: "Use 'Work.relations.hasReview' instead")
}


enum ReviewElementType {
  ABSTRACT
  ACQUISITION_RECOMMENDATIONS
  AUDIENCE
  CONCLUSION
  DESCRIPTION
  EVALUATION
  SIMILAR_MATERIALS
}
type ReviewElement {
  content: String

  """
  This is a paragraph containing markup where links to manifestations
  can be inserted. For instance '"Axel Steens nye job minder om [870970-basis:20307021] fra ...'.
  Relevant manifestations are located in the manifestations field. 
  """
  contentSubstitute: String

  heading: String

  """
  Manifestations that can be used to generate and insert links into 'contentSubsitute'.
  """
  manifestations: [Manifestation]


  type: ReviewElementType
}

type ManifestationReview {
  rating: String
  reviewByLibrarians: [ReviewElement]
}

extend type Manifestation {

  """
  Some review data, if this manifestation is a review
  """
  review: ManifestationReview
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
    parseDate(
      getArray(parent, "details.articleData.article.volume").map(
        (entry) => entry.$
      )[0]
    ) ||
    parseDate(
      getArray(parent, "admindata.creationDate").map((entry) => entry.$)[0]
    )
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

function parseDate(str) {
  if (str?.match?.(/\d{4}-\d{2}-\d{2}/)) {
    return str;
  }
  return null;
}

/**
 * Resolver for __typename
 * @param {object} parent
 */
function resolveTypeName(parent) {
  if (parent?.details?.fulltextmatvurd) {
    return "LibrariansReview";
  }
  if (parent?.details?.infomedia) {
    return "InfomediaReview";
  }
  if (parent?.urls?.length > 0) {
    return "ExternalReview";
  }
}

/**
 * Resolver for volume
 * @param {object} parent
 */
function resolveVolume(parent) {
  const volume = getArray(parent, "details.articleData.article.volume").map(
    (entry) => entry.$
  )[0];

  if (!parseDate(volume)) {
    return volume;
  }
}

/**
 * Resolves reviews of the work
 */
async function resolveReviews(parent, context) {
  const work = await context.datasources
    .getLoader("jedRelations")
    .load({ id: parent.workId, profile: context.profile });

  if (!work?.relations) {
    return [];
  }

  let reviews = (
    await Promise.all(
      work.relations.hasReview.map((pid) =>
        context.datasources.getLoader("openformat").load(pid)
      )
    )
  )
    .filter((review) => !!review)
    .map((review) => {
      const parsed = {
        author: resolveAuthor(review),
        date: resolveDate(review),
        volume: resolveVolume(review),
        pages: getArray(review, "details.pagination.value")?.[0]?.$,
        origin: resolveMedia(review),
        rating: resolveRating(review),
        faustOfhostPublication: getArray(
          review,
          "details.hostPublicationPid"
        )?.[0]?.$,
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
        __typename: resolveTypeName(review),
      };

      return parsed;
    });
  reviews = orderBy(reviews, "date", "desc");
  reviews = uniqBy(reviews, "author");

  return reviews;
}

export const resolvers = {
  WorkReview: {
    periodica(parent) {
      if (parent?.volume || parent?.pages || parent?.faustOfhostPublication) {
        return parent;
      }
    },
    librariansReview(parent) {
      const sections = [];
      parent?.fulltextmatvurd?.map?.(([code, entry]) => {
        const entries = (Array.isArray(entry) ? entry : [entry]).map(
          (entry) => entry
        );
        entries.forEach((e) => {
          code = code.toUpperCase();
          sections.push({
            code,
            heading: reviews.heading[code]?.da,
            text: getArray(e, "text.$").join("\n") || "",
            faust: e?.faust?.$,
          });
        });
      });

      if (sections.length) {
        return sections.filter((entry) => !!reviews.heading[entry.code]);
      }
    },
  },
  PeriodicaReviewDetails: {
    async hostPublication(parent, args, context, info) {
      if (parent.faustOfhostPublication) {
        const work = await resolveWork(
          { faust: parent.faustOfhostPublication },
          context
        );
        return work;
      }
      return null;
    },
  },
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
      const sections = [];
      parent?.fulltextmatvurd?.map?.(([code, entry]) => {
        const entries = (Array.isArray(entry) ? entry : [entry]).map(
          (entry) => entry
        );
        entries.forEach((e) => {
          code = code.toUpperCase();
          sections.push({
            code,
            heading: reviews.heading[code]?.da,
            text: getArray(e, "text.$").join("\n") || "",
            faust: e?.faust?.$,
          });
        });
      });

      if (sections.length) {
        return sections.filter((entry) => !!reviews.heading[entry.code]);
      }
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
    workReviews(parent, args, context, info) {
      return resolveReviews(parent, context);
    },
  },
  ReviewElement: {
    async manifestations(parent, args, context, info) {
      const manifestations = Promise.all(
        parent?.pidList?.map((pid) => {
          return resolveManifestation({ pid }, context);
        })
      );

      return manifestations;
    },
    async contentSubstitute(parent, args, context, info) {
      // TODO this is temporary until JED provides this string

      let substitute = parent?.content;

      // get all manifestations that are refered to in 'content'
      const manifestations = await Promise.all(
        parent?.pidList?.map((pid) => {
          return resolveManifestation({ pid }, context);
        })
      );

      // Substitute title for pid
      manifestations.forEach((m) => {
        substitute = substitute?.replace(m?.titles?.main, `[${m?.pid}]`);
      });

      return substitute;
    },
  },
};
