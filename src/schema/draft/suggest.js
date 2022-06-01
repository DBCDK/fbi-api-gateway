import { resolveWork } from "../../utils/utils";

export const typeDef = `
enum Draft_SuggestionType {
  SUBJECT
  TITLE
  CREATOR
  COMPOSIT
}
type Draft_Suggestion {
  """
  The type of suggestion: creator, subject or title
  """
  type: Draft_SuggestionType!

  """
  The suggested term which can be searched for
  """
  term: String!

  """
  A work related to the term
  """
  work: Draft_Work
}
type Draft_SuggestResponse {
  result: [Draft_Suggestion!]!
}
`;

export const resolvers = {
  Draft_Suggestion: {
    type(parent) {
      return parent?.type?.toUpperCase();
    },
    async work(parent, args, context, info) {
      return resolveWork({ id: parent.work }, context);
    },
  },
  Draft_SuggestResponse: {
    async result(parent, args, context, info) {
      const res = await context.datasources.suggester.load({
        ...parent,
        profile: context.profile,
      });
      return res;
    },
  },
};
