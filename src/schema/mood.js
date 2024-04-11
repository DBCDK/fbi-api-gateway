import { resolveManifestation, resolveWork } from "../utils/utils";

export const typeDef = `
  enum MoodFieldType {
      TITLE
      CREATOR
      MOODTAGS
      ALL
   }
   
   type MoodSearchResponseType {
    """   
    Title(s) of work - is set when debug is true
    """
    title: [String!]
    
    """
    Creator(s) of work - is set when debug is true
    """
    creator: [String!]
    
    """
    The work
    """
    work: Work!
   }
   
   type MoodSearchResponse {

    """
    Response is an array of MoodSearchResponseType
    """
    response: [MoodSearchResponseType!]!
  }
  `;

export const resolvers = {
  MoodSearchResponseType: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.workid }, context);
    },
  },
};
