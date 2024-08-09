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
   enum MoodSuggestEnum {
      TITLE
      CREATOR
      TAG
   }

   """
   MoodSuggest item
   """
   type MoodSuggestItem {
    """
    Suggestion
    """
    term: String!
    """
    The type of suggestion title/creator/tag
    """
    type: MoodSuggestEnum!
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
    Response is an array of MoodSuggestResponse
    """
    response: [MoodSuggestItem!]!
  }

  """
  Supported fields for moodsearch request
  """
   enum MoodSearchFieldValuesEnum {
    ALL
    TITLE
    CREATOR
    MOODTAGS @deprecated(reason: "This is another good reason! expires:01/06-2024")
    ALLTAGS
   }
   
   input KidRecommenderTagsInput{
    tag: String
    weight: Int
   }
   
   input MoodKidsRecommendFiltersInput {
    difficulty: [Int!]
    illustrationsLevel: [Int!]
    length: [Int!]
    realisticVsFictional: [Int!]
    fictionNonfiction: FictionNonfictionCodeEnum
   }

   """
   The response from moodsearch
   """
   type MoodSearchResponse {
    """
    The works matching the given search query. Use offset and limit for pagination.
    """
    works(offset: Int! limit: PaginationLimitScalar!): [Work!]! @complexity(value: 5, multipliers: ["limit"])
  }
  """
  The reponse from moodsearchkids
  """
  type MoodSearchKidsResponse {
    works(offset: Int! limit: PaginationLimitScalar!): [Work!]! @complexity(value: 5, multipliers: ["limit"])
  }
  
  """
  The reponse from moodrecommenkids
  """
  type MoodRecommendKidsResponse {
    works(offset: Int! limit: PaginationLimitScalar!): [Work!]! @complexity(value: 5, multipliers: ["limit"])
  }

  type MoodQueries {
    moodSearch(q:String!, field: MoodSearchFieldValuesEnum @deprecated(reason: "This is also a good reason! expires:01/08-2024"), offset: Int, limit: Int @deprecated(reason: "This is also a good reason! expires:01/08-2024")): MoodSearchResponse!
    moodSearchKids(q:String!, field: MoodSearchFieldValuesEnum, offset: Int, limit: Int): MoodSearchKidsResponse!
    moodSuggest(q:String!, limit: Int):MoodSuggestResponse!
    moodTagRecommend(tags: [String!]!, limit:Int, plus: [String!], minus: [String!], hasCover:Boolean): [MoodTagRecommendResponse]!
    moodWorkRecommend(likes:[String!]!, dislikes:[String!], limit: Int, offset: Int, maxAuthorRecommendations: Int, threshold: Float, hasCover: Boolean):[MoodTagRecommendResponse]!
    moodRecommendKids(tags: [KidRecommenderTagsInput!], work: String, filters: MoodKidsRecommendFiltersInput, dislikes:[String!], offset: Int, limit: Int):MoodRecommendKidsResponse! @deprecated(reason: "This is a good reason! expires:01/12-2024")
  }

  extend type Query {
    mood: MoodQueries! @deprecated(reason: "This is a good reason! expires:19/09-2024")
  }

  `;

async function getSearchExpanded(res, context) {
  if (!res?.response) {
    return [];
  }

  return await Promise.all(
    res?.response?.map(async ({ workid }) => {
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

  MoodQueries: {
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
    async moodRecommendKids(parent, args, context, info) {
      return {
        ...args,
        ...{ agency: context.profile.agency, profile: context.profile.name },
      };
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
        .getLoader("moodSearchKids")
        .load({ ...parent, ...args });

      return getSearchExpanded(res, context);
    },
  },
  MoodRecommendKidsResponse: {
    async works(parent, args, context, info) {
      const res = await context.datasources
        .getLoader("moodRecommendKids")
        .load({ ...parent, ...args });

      return getSearchExpanded(res, context);
    },
  },
  MoodSuggestItem: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.work }, context);
    },
    type(parent, args, context, info) {
      return parent.type?.toUpperCase();
    },
  },
  MoodTagRecommendResponse: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.workid }, context);
    },
  },
};
