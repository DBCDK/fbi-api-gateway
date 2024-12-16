import { createTraceId } from "../utils/trace";

export const typeDef = `
"""
Get different kinds of recommendations
"""
type Recommendations {
  """
  Retrieve subject-based recommendations based on a list of query strings and an optional limit.
  - q: An array of strings used to generate subject recommendations.
  - limit: The maximum number of recommendations to return.
  """
  subjects(q:[String!]!, limit:Int ): [SubjectRecommendation!] @complexity(value: 3, multipliers: ["q", "limit"])
}

"""
Details about a single subject recommendation.
"""
type SubjectRecommendation {
  """
  The recommended subject.
  """
  subject: String!

  """
  A unique identifier for tracking user interactions with this subject recommendation. 
  It is generated in the response and should be included in subsequent
  API calls when this suggestion is selected.
  """
  traceId: String!

}

extend type Query {
  """
  Access to various types of recommendations.
  """
  recommendations: Recommendations!
}
`;

export const resolvers = {
  Query: {
    recommendations() {
      return {};
    },
  },
  Recommendations: {
    async subjects(parent, args, context, info) {
      const related = await context.datasources
        .getLoader("relatedSubjects")
        .load({ q: args.q, limit: args.limit });
      return related.response?.map((subject) => ({
        subject,
        traceId: createTraceId(),
      }));
    },
  },
};
