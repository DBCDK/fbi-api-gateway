import { resolveWork } from "../../utils/utils";

export const typeDef = `
enum SuggestionType {
  SUBJECT
  TITLE
  CREATOR
  COMPOSIT
}
type Suggestion {
  """
  The type of suggestion: creator, subject or title
  """
  type: SuggestionType!

  """
  The suggested term which can be searched for
  """
  term: String!

  """
  A work related to the term
  """
  work: Work
}
type SuggestResponse {
  result: [Suggestion!]!
}

type localSuggestResponse{
result: [Suggestion!]!
}
`;

export const resolvers = {
  Suggestion: {
    type(parent) {
      return parent?.type?.toUpperCase();
    },
    async work(parent, args, context, info) {
      return resolveWork({ id: parent.work }, context);
    },
  },
  SuggestResponse: {
    async result(parent, args, context, info) {
      const res = await context.datasources.suggester.load({
        ...parent,
        ...args,
        profile: context.profile,
      });
      return res;
    },
  },
  localSuggestResponse: {
    async result(parent, args, context, info) {
      const res = await context.datasources.prosper.load({
        ...parent,
        ...args,
        profile: context.profile,
      });
      return res;
    },
  },
};
