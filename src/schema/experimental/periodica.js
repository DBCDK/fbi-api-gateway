/**
 * @file Proof of Concept (PoC) schema and resolvers for handling periodicals.
 *
 * This module utilizes complex search to extract and process periodical data.
 * The primary objective is to retrieve articles from a periodical and group them into issues
 * (e.g., Årg. 101, nr. 4 (2020)).
 *
 * This PoC is designed to analyze the data and assess its usability in a UI context.
 * It is **not intended for production use**, as the implementation is subject to change.
 * Additionally, performance metrics will be evaluated, which may lead to the development
 * of a dedicated service for handling periodicals.
 */

import { resolveWork } from "../../utils/utils";

export const typeDef = `
"""
A periodica that contains all its issues and subjects
"""
type Periodica {
  articles: PeriodicaArticlesResponse!
  issues: PeriodicaEntriesResponse!
  subjects: PeriodicaFacetResponse!
}

type PeriodicaFacetResponse {
  hitcount: Int!
  entries(offset: Int, limit: Int): [FacetValue!]
}

type PeriodicaArticlesResponse {
  hitcount: Int!
  first: Work
  last: Work
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

type SimilarPeriodicaArticleEntry {
  sharedSubjects: [String!]!
  work: Work!
}

extend type Query {
   periodica(issn: String!): Periodica
}


type WorkPeriodicaInfo {
  """
  If current work is an article, its parent is the periodica work
  """
  parent: Work

  """
  Is set when this is work is the actual periodica
  """
  periodica: Periodica

  """
  is set when this work is an article in an issue of a periodica
  """
  issue: PeriodicaIssue

  """
  Articles in same periodica that are similar in terms of subjects
  """
  similarArticles: [SimilarPeriodicaArticleEntry!]
}

extend type Work {
  """
  Periodica info is set if this is a periodica or an article in periodica
  """
  periodicaInfo: WorkPeriodicaInfo
}
`;

export const resolvers = {
  Work: {
    async periodicaInfo(parent, args, context) {
      const manifestation = parent?.manifestations?.all?.[0];
      const issn = manifestation?.identifiers?.find(
        (entry) => entry?.type === "ISSN"
      )?.value;

      if (issn) {
        return {
          periodica: await resolvePeriodica(issn, context),
        };
      }

      const hostIssn = manifestation?.hostPublication?.issn;
      const issue = manifestation?.hostPublication?.issue;
      if (hostIssn) {
        return {
          workId: parent?.workId,
          manifestation,
          hostIssn,
          issue: await resolvePeriodicaIssue(hostIssn, issue, context),
        };
      }

      return null;
    },
  },
  WorkPeriodicaInfo: {
    parent(parent, args, context) {
      return resolveWorkFromIssn(parent?.hostIssn, context);
    },
    async similarArticles({ hostIssn, workId, manifestation }, args, context) {
      return resolveSimilarArticles(
        { hostIssn, workId, manifestation },
        context
      );
    },
  },
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
    async hitcount(parent, args, context) {
      const issn = parent?.issn;
      const res = await context.datasources
        .getLoader("periodicaIssues")
        .load({ issn, profile: context.profile });
      return res.hitcount;
    },
    async entries(parent, args, context) {
      const offset = args?.offset || 0;
      const limit = Math.min(
        100,
        typeof args?.limit === "undefined" ? 10 : args?.limit
      );
      const issn = parent?.issn;
      const res = await context.datasources
        .getLoader("periodicaIssues")
        .load({ issn, profile: context.profile });
      const entries = res?.entries?.slice?.(offset, offset + limit) || [];

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
    async articles(parent, args, context) {
      const issn = parent.issn;

      const resFirst = await context.datasources
        .getLoader("complexsearch")
        .load({
          cql: `term.issn="${issn}" AND worktype="Article"`,
          profile: context.profile,
          offset: 0,
          limit: 1,
          sort: [{ index: "sort.latestpublicationdate", order: "ASC" }],
        });
      const resLast = await context.datasources
        .getLoader("complexsearch")
        .load({
          cql: `term.issn="${issn}" AND worktype="Article"`,
          profile: context.profile,
          offset: 0,
          limit: 1,
          sort: [{ index: "sort.latestpublicationdate", order: "DESC" }],
        });

      return {
        hitcount: resFirst.hitcount,
        first: await resolveWork({ id: resFirst?.works?.[0] }, context),
        last: await resolveWork({ id: resLast?.works?.[0] }, context),
      };
    },
    async subjects(parent, args, context) {
      const issn = parent?.issn;
      const res = await context.datasources
        .getLoader("periodicaSubjects")
        .load({
          issn,
          profile: context.profile,
        });
      return res;
    },
  },
  Query: {
    async periodica(parent, args, context, info) {
      return resolvePeriodica(args?.issn, context);
    },
  },
};

export async function resolvePeriodica(issn, context) {
  if (!issn) {
    return null;
  }

  return {
    issn,
    issues: {
      issn,
    },
  };
}

export async function resolvePeriodicaIssue(issn, issue, context) {
  const res = await context.datasources.getLoader("complexsearch").load({
    cql: `term.issn="${issn}" AND phrase.issue="${issue}"`,
    profile: context.profile,
    offset: 0,
    limit: 100,
  });
  return { ...res, display: issue };
}

export async function resolveWorkFromIssn(issn, context) {
  if (!issn) {
    return null;
  }
  const res = await context.datasources.getLoader("complexsearch").load({
    cql: `term.issn="${issn}" AND worktype=periodica`,
    profile: context.profile,
    offset: 0,
    limit: 1,
  });
  const workId = res?.works?.[0];
  return resolveWork({ id: workId }, context);
}

export async function resolveSimilarArticles(
  { hostIssn, workId, manifestation },
  context
) {
  const periodicaSubjects = await context.datasources
    .getLoader("periodicaSubjects")
    .load({
      issn: hostIssn,
      profile: context.profile,
    });

  // Create a map of subjects from the periodical for quick lookup
  // Each subject has a score (number of articles in the periodica with this subject)
  const periodicaSubjectsMap = {};
  periodicaSubjects?.entries?.forEach((entry) => {
    periodicaSubjectsMap[entry.key?.toLowerCase()] = entry;
  });

  // Identify the most significant subjects (lowest scores indicate higher significance)
  let sum = 0;
  const subjects = manifestation?.subjects?.dbcVerified?.subjects
    ?.map?.((subject) => ({
      ...subject,
      score: periodicaSubjectsMap[subject?.display?.toLowerCase()]?.score,
    }))
    ?.filter((entry) => entry?.score > 1) // Exclude subjects with la score of one (no other articles have that subject)
    ?.sort((a, b) => a?.score - b?.score) // Sort by ascending score (most significant first)
    ?.filter((entry) => {
      // Limit the total score sum to 20 to avoid including too many subjects
      // We don't want subjects that are too broad, like "historie"
      if (sum > 20) {
        return false;
      }
      sum += entry?.score;
      return true;
    });

  // Perform a complex search for articles that match the host ISSN and selected subjects
  const res = await context.datasources.getLoader("complexsearch").load({
    cql: `term.issn="${hostIssn}" AND phrase.subject=(${subjects?.map((s) => `"${s.display}"`).join(" OR ")})`,
    profile: context.profile,
    offset: 0,
    limit: 21,
  });

  // Create a map of subjects from the current article for easy comparison
  const articleSubjectsMap = {};
  manifestation?.subjects?.dbcVerified?.subjects?.forEach((subject) => {
    articleSubjectsMap[subject?.display?.toLowerCase()] = subject;
  });

  // Resolve works via JED
  const works = await Promise.all(
    res?.works?.map((workId) => resolveWork({ id: workId }, context))
  );

  // Filter and structure the results
  return works
    ?.map((work) => {
      // Identify shared subjects between the current article and the retrieved works
      const sharedSubjects = work?.subjects?.dbcVerified?.subjects
        ?.filter?.(
          (subject) => articleSubjectsMap[subject?.display?.toLowerCase()]
        )
        ?.map((subject) => subject.display);
      return { work, sharedSubjects };
    })
    ?.filter(
      (entry) =>
        entry?.sharedSubjects?.length > 0 && // Ensure there are shared subjects
        entry?.work?.workId !== workId // Exclude the original work
    )
    ?.sort((a, b) => b?.sharedSubjects?.length - a?.sharedSubjects?.length); // Sort by number of shared subjects (descending)
}
