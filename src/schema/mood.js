/**
 * @file mood.js
 * type definitions for appeal data
 */
import { resolveManifestation, resolveWork } from "../utils/utils";
import { log } from "dbc-node-logger";

export const typeDef = `
  """
  Type of moodSuggest response
  """
   enum MoodSuggest {
      title
      creator
      tag
   }

   """
   Response type for moodSuggest
   """
   type moodSuggestResponse {
    """
    Suggestion
    """
    term: String!
    """
    The type of suggestion title/creator/tag
    """
    type: MoodSuggest!
    """
    A work associated with the suggestion
    """
    work: Work
   }

   """
   Response type for moodTagRecommend
   """
   type MoodTagRecommendResponse {
    work: Work!
    similarity: Float
   }

   """
   The response type for moodSuggest
   """
   type MoodSuggestResponse {
    """
    Response is an array of moodSuggestResponse
    """
    response: [moodSuggestResponse!]!
  }

  """
  Supported fields for moodsearch request
  """
   enum MoodSearchFieldValues {
    ALL
    TITLE
    CREATOR
    MOODTAGS
   }

   """
   The response from moodsearch
   """
   type MoodSearchResponse {
    """
    The works matching the given search query. Use offset and limit for pagination.
    """
    works(offset: Int! limit: PaginationLimit!): [Work!]! @complexity(value: 5, multipliers: ["limit"])
  }
  """
  The reponse from moodsearchkids
  """
  type MoodSearchKidsResponse {
    works(offset: Int! limit: PaginationLimit!): [Work!]! @complexity(value: 5, multipliers: ["limit"])
  }

  type moodQueries {
    moodSearch(q:String!, field: MoodSearchFieldValues, offset: Int, limit: Int): MoodSearchResponse!
    moodSearchKids(q:String!, field: MoodSearchFieldValues, offset: Int, limit: Int): MoodSearchResponse!
    moodSuggest(q:String!, limit: Int):MoodSuggestResponse!
    moodTagRecommend(tags: [String!]!, limit:Int, plus: [String!], minus: [String!], has_cover:Boolean): [MoodTagRecommendResponse]!
    moodWorkRecommend(likes:[String!]!, dislikes:[String!], limit: Int, offset: Int, max_author_recommendations: Int, threshold: Float, has_cover: Boolean):[MoodTagRecommendResponse]!
  }

  extend type Query {
    mood: moodQueries!
  }

  `;

async function getSearchExpanded(res, context) {
  return await Promise.all(
    res.response.map(async ({ workid }) => {
      const work = await resolveWork({ id: workid }, context);
      if (!work) {
        // log for debugging - see BIBDK2021-1256
        log.error("WORKID NOT FOUND in jed-presentation service", {
          workId: workid,
        });
      }
      return work;
    })
  );
}

export const resolvers = {
  Query: {
    async mood(parent, args, context, info) {
      return {};
    },
  },

  moodQueries: {
    async moodSearch(parent, args, context, info) {
      return {
        ...args,
        ...{ agency: context.profile.agency, profile: context.profile.name },
      };
    },
    async moodSuggest(parent, args, context, info) {
      const response = await context.datasources
        .getLoader("moodMatchSuggest")
        .load({
          ...args,
          ...{ agency: context.profile.agency, profile: context.profile.name },
        });
      return response;
    },
    async moodTagRecommend(parent, args, context, info) {
      const response = await context.datasources
        .getLoader("moodTagRecommend")
        .load({
          ...args,
          ...{ agency: context.profile.agency, profile: context.profile.name },
        });
      return response;
    },
    async moodWorkRecommend(parent, args, context, info) {
      const response = await context.datasources
        .getLoader("moodWorkRecommend")
        .load({
          ...args,
          ...{ agency: context.profile.agency, profile: context.profile.name },
        });
      return response;
    },
    async moodSearchKids(parent, args, context, info) {
      return {
        ...args,
        ...{ agency: context.profile.agency, profile: context.profile.name },
      };
    },
  },

  MoodSearchResponse: {
    async works(parent, args, context, info) {
      const res = await context.datasources
        .getLoader("moodMatchSearch")
        .load({ ...parent, ...args });

      return getSearchExpanded(res, context);
    },
  },
  MoodSearchKidsResponse: {
    async works(parent, args, context, info) {
      const res = await context.datasources
        .getLoader("moodMatchSearch")
        .load({ ...parent, ...args });

      return getSearchExpanded(res, context);
    },
  },
  moodSuggestResponse: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.work }, context);
    },
  },
  MoodTagRecommendResponse: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.workid }, context);
    },
  },
};
