import { createTraceId } from "../../utils/trace";
import { resolveWork } from "../../utils/utils";

export const typeDef = `
enum SuggestionTypeEnum {
  SUBJECT
  TITLE
  CREATOR
  COMPOSIT
}

enum ComplexSuggestionTypeEnum {
  HOSTPUBLICATION
  CONTRIBUTORFUNCTION
  CREATOR
  DEFAULT
  CREATORCONTRIBUTORFUNCTION
  CREATORFUNCTION
  SUBJECT
  FICTIONALCHARACTER
  TITLE
  CREATORCONTRIBUTOR
  SERIES
  PUBLISHER
}

type ComplexSearchSuggestion {

  """
  A unique identifier for tracking user interactions with this suggestion. 
  It is generated in the response and should be included in subsequent
  API calls when this suggestion is selected.
  """
  traceId: String!

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
  A unique identifier for tracking user interactions with this suggestion. 
  It is generated in the response and should be included in subsequent
  API calls when this suggestion is selected.
  """
  traceId: String!

  """
  The type of suggestion: creator, subject or title
  """
  type: SuggestionTypeEnum!

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

type LocalSuggestResponse{
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
      const input = {
        ...parent,
        ...args,
        profile: context.profile,
      };
      const res = await context.datasources.getLoader("suggester").load(input);
      const suggestions = res?.map((entry) => ({
        ...entry,
        traceId: createTraceId(),
      }));

      context?.dataHub?.createSuggestEvent({ input, suggestions });

      return suggestions || [];
    },
  },
  ComplexSuggestResponse: {
    async result(parent, args, context, info) {
      const input = {
        ...parent,
        ...args,
        profile: context.profile,
      };
      const res = await context.datasources
        .getLoader("complexSuggest")
        .load(input);

      const suggestions = res?.map((entry) => ({
        ...entry,
        traceId: createTraceId(),
      }));
      context?.dataHub?.createComplexSuggestEvent({ input, suggestions });
      return suggestions || [];
    },
  },
  LocalSuggestResponse: {
    async result(parent, args, context, info) {
      const input = {
        ...parent,
        ...args,
        profile: context.profile,
      };
      const res = await context.datasources.getLoader("prosper").load(input);

      const suggestions = res?.map((entry) => ({
        ...entry,
        traceId: createTraceId(),
      }));

      context?.dataHub?.createSuggestEvent({ input, suggestions });

      return suggestions || [];
    },
  },
};
