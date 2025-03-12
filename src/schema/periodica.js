import {
  resolveWork,
  resolvePeriodica,
  resolvePeriodicaIssue,
} from "../utils/utils";

export const typeDef = `
"""
A periodica that contains all its issues and subjects
"""
type Periodica {
  issues: PeriodicaEntriesResponse!
  subjects: PeriodicaFacetResponse!
}

type PeriodicaFacetResponse {
  hitcount: Int!
  entries(offset: Int, limit: Int): [FacetValue!]
}

type PeriodicaEntriesResponse {
  hitcount: Int!
  entries(offset: Int, limit: Int): [PeriodicaIssue!]!
}

type PeriodicaIssue {
   display: String!
   hitcount: Int!
   works(offset: Int, limit: Int): [Work!]!
}


extend type Query {
   periodica(issn: String!): Periodica
}
`;

export const resolvers = {
  PeriodicaIssue: {
    async works(parent, args, context) {
      const workIds = parent?.works;

      const offset = args?.offset || 0;
      const limit = args.limit || 10;
      const result = await Promise.all(
        workIds?.slice(offset, limit).map(async (workId) => {
          const work = await resolveWork({ id: workId }, context);

          return work;
        })
      );

      return result?.filter?.((work) => !!work);
    },
  },
  PeriodicaEntriesResponse: {
    async entries(parent, args, context) {
      const offset = args?.offset || 0;
      const limit = Math.min(
        100,
        typeof args?.limit === "undefined" ? 10 : args?.limit
      );
      const issn = parent?.issn;
      const entries = parent?.entries?.slice?.(offset, offset + limit) || [];

      // fetch works of issues via complex search
      return await Promise.all(
        entries?.map((issue) => resolvePeriodicaIssue(issn, issue, context))
      );
    },
  },
  PeriodicaFacetResponse: {
    entries(parent, args) {
      const offset = args?.offset || 0;
      const limit = Math.min(
        100,
        typeof args?.limit === "undefined" ? 10 : args?.limit
      );
      const entries = parent?.entries;

      return entries?.slice?.(offset, offset + limit);
    },
  },
  Periodica: {
    subjects(parent, args) {
      const entries = parent?.subjects?.entries;
      return {
        hitcount: entries?.length || 0,
        entries: entries,
      };
    },
  },
  Query: {
    async periodica(parent, args, context, info) {
      return resolvePeriodica(args?.issn, context);
    },
  },
};
