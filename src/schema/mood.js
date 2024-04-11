import { resolveManifestation, resolveWork } from "../utils/utils";
import { log } from "dbc-node-logger";

export const typeDef = `
  enum MoodFieldType {
      TITLE
      CREATOR
      MOODTAGS
      ALL
   }
   
   enum MoodSuggestType {
      TITLE
      CREATOR
      TAG
   }
   
   type MoodSuggestResponseType {
    """
    Suggestion
    """
    term: String!
    """
    The type of suggestion title/creator/tag
    """
    type: MoodSuggestType!
    """
    A work associated with the suggestion
    """
    work: Work
    """
    Score of suggestion
    """
    weight: Int!
    """
    The type of solr suggestion infix/blended_infix/fuzzy 
    """
    suggest_type: String! 
   }
   
   type MoodSearchResponse {
    """
    The works matching the given search query. Use offset and limit for pagination.
    """
    works(offset: Int! limit: PaginationLimit!): [Work!]! @complexity(value: 5, multipliers: ["limit"])
  }
  
  type MoodSuggestResponse {
    """
    Response is an array of MoodSuggestResponseType
    """
    response: [MoodSuggestResponseType!]!
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
  MoodSuggestResponseType: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.work }, context);
    },
  },
};
