import { resolveWork } from "../../utils/utils";

export const typeDef = `
enum SuggestionType {
  SUBJECT
  TITLE
  CREATOR
  COMPOSIT
}

enum ComplexSuggestionType {
  title
  creator
}

type ComplexSearchSuggestion {
  """
  The type of suggestion
  """
  type: String!

  """
  The suggested term which can be searched for
  """
  term: String!

  """
  A work related to the term
  """
  work: Work @complexity(value: 5)
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
  work: Work @complexity(value: 5)
}

type ComplexSuggestResponse {
  result: [ComplexSearchSuggestion!]!
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
  ComplexSearchSuggestion: {
    async work(parent, args, context, info) {
      return resolveWork({ id: parent.work }, context);
    },
  },
  SuggestResponse: {
    async result(parent, args, context, info) {
      const res = await context.datasources.getLoader("suggester").load({
        ...parent,
        ...args,
        profile: context.profile,
      });
      return res;
    },
  },
  ComplexSuggestResponse: {
    async result(parent, args, context, info) {
      const res = await context.datasources.getLoader("complexSuggest").load({
        type: parent.type,
        q: parent.q,
        profile: context.profile,
      });
      return res;
    },
  },
  localSuggestResponse: {
    async result(parent, args, context, info) {
      const res = await context.datasources.getLoader("prosper").load({
        ...parent,
        ...args,
        profile: context.profile,
      });
      return res;
    },
  },
};
