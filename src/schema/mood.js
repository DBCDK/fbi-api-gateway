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
  `;

export const resolvers = {
  MoodSearchResponse: {
    async works(parent, args, context, info) {
      const res = await context.datasources
        .getLoader("moodMatchSearch")
        .load({ ...parent, ...args });
      const expanded = await Promise.all(
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
      return expanded;
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
