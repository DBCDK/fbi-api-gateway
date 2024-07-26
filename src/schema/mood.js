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
    Response is an array of MoodSuggestResponse
    """
    response: [MoodSuggestItem!]!
  }

  """
  Supported fields for moodsearch request
  """
   enum MoodSearchFieldValues {
    ALL
    TITLE
    CREATOR
    MOODTAGS
    ALLTAGS
   }
   
   input KidRecommenderTags{
    tag: String
    weight: Int
   }
   
   input MoodKidsRecommendFilters {
    difficulty: [Int!]
    illustrationsLevel: [Int!]
    length: [Int!]
    realisticVsFictional: [Int!]
    fictionNonfiction: FictionNonfictionCode
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
  
  """
  The reponse from moodrecommenkids
  """
  type MoodRecommendKidsResponse {
    works(offset: Int! limit: PaginationLimit!): [Work!]! @complexity(value: 5, multipliers: ["limit"])
  }

  type MoodQueries {
    moodSearch(q:String!, field: MoodSearchFieldValues, offset: Int, limit: Int): MoodSearchResponse!
    moodSearchKids(q:String!, field: MoodSearchFieldValues, offset: Int, limit: Int): MoodSearchKidsResponse!
    moodSuggest(q:String!, limit: Int):MoodSuggestResponse!
    moodTagRecommend(tags: [String!]!, limit:Int, plus: [String!], minus: [String!], hasCover:Boolean): [MoodTagRecommendResponse]!
    moodWorkRecommend(likes:[String!]!, dislikes:[String!], limit: Int, offset: Int, maxAuthorRecommendations: Int, threshold: Float, hasCover: Boolean):[MoodTagRecommendResponse]!
    moodRecommendKids(tags: [KidRecommenderTags!], work: String, filters: MoodKidsRecommendFilters, dislikes:[String!], offset: Int, limit: Int):MoodRecommendKidsResponse!
  }

  extend type Query {
    mood: MoodQueries!
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
