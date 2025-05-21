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
type Periodical {

  """Info about articles in this periodical"""
  articles: PeriodicalArticlesResponse!

  """All issues in this periodical"""
  issues(filters: [PeriodicalIssueFilterInput!]): PeriodicalEntriesResponse!
}

enum PeriodicalFacetEnum {
  SUBJECT
  PUBLICATIONYEAR
}

type PeriodicalFacetResponse {
  facet: PeriodicalFacetEnum!

  """Total number of matching items"""
  hitcount: Int!

  """Facet entries"""
  entries(offset: Int, limit: Int): [FacetValue!]
}

"""
Metadata about articles in a periodical
"""
type PeriodicalArticlesResponse {
  """Total number of articles in the periodical"""
  hitcount: Int!

  """First article (e.g. chronologically)"""
  first: Work

  """Last article (e.g. most recent)"""
  last: Work
}


"""
Response containing all issues of a periodical
"""
type PeriodicalEntriesResponse {
"""Total number of issues in periodical"""
  hitcount: Int!

  """List of issues"""
  entries(offset: Int, limit: Int): [PeriodicalIssue!]!

  """Subjects aggregated from articles in the issues"""
  subjects: PeriodicalFacetResponse!

  """Publication years aggregated from articles in the issues"""
  publicationYears: PeriodicalFacetResponse!

  """Smart facets inferred from periodical metadata"""
  intelligentFacets: [PeriodicalFacetResponse!]!
}

"""
A single issue of a periodical
"""
type PeriodicalIssue {
  """Display name of the issue (e.g. "2023, nr. 2")"""
  display: String!

  """Number of works/articles in the issue"""
  hitcount: Int!

  """List of works/articles in this issue"""
  works(offset: Int, limit: Int): [Work!]!
}

"""
An article similar to another, with shared subjects
"""
type SimilarPeriodicalArticleEntry {
  """Subjects shared with the reference article"""
  sharedSubjects: [String!]!

  """The similar article"""
  work: Work!
}

type PeriodicalArticle {
  """
  Is set when this is work is the actual periodica
  """
  parentPeriodical: Work

  """
  is set when this work is an article in an issue of a periodica
  """
  parentIssue: PeriodicalIssue

  """
  Articles in same periodica that are similar in terms of subjects
  """
  similarArticles: [SimilarPeriodicalArticleEntry!]
}

input PeriodicalIssueFilterInput {
  key: PeriodicalFacetEnum!
  values: [String!]!
}

union WorkExtensionUnion = Periodical | PeriodicalArticle

extend type Work {
   """Contains either a Periodical or a PeriodicalArticle"""
  extendedWork: WorkExtensionUnion
}
`;

export const resolvers = {
  Work: {
    async extendedWork(parent, args, context) {
      const manifestation = parent?.manifestations?.all?.[0];
      const hostIssn = manifestation?.hostPublication?.issn;
      const issue = manifestation?.hostPublication?.issue;
      if (hostIssn) {
        return {
          __typename: "PeriodicalArticle",
          workId: parent?.workId,
          manifestation,
          hostIssn,
          issue: await resolvePeriodicalIssue(hostIssn, issue, context),
        };
      }

      const issn = manifestation?.identifiers?.find(
        (entry) => entry?.type === "ISSN"
      )?.value;

      if (issn) {
        return resolvePeriodical(issn, context);
      }

      return null;
    },
  },
  PeriodicalArticle: {
    parentPeriodical(parent, args, context) {
      return resolveWorkFromIssn(parent?.hostIssn, context);
    },
    async similarArticles({ hostIssn, workId, manifestation }, args, context) {
      return resolveSimilarArticles(
        { hostIssn, workId, manifestation },
        context
      );
    },
  },
  PeriodicalIssue: {
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
  PeriodicalEntriesResponse: {
    async hitcount(parent, args, context) {
      const filters = parent?.issuesArgs?.filters;
      const issn = parent?.issn;
      const res = await context.datasources
        .getLoader("periodicaIssues")
        .load({ issn, profile: context.profile, filters });
      return res.hitcount;
    },
    async entries(parent, args, context) {
      const filters = parent?.issuesArgs?.filters;
      const offset = args?.offset || 0;
      const limit = Math.min(
        100,
        typeof args?.limit === "undefined" ? 10 : args?.limit
      );
      const issn = parent?.issn;
      const res = await context.datasources
        .getLoader("periodicaIssues")
        .load({ issn, profile: context.profile, filters });
      const entries = res?.entries?.slice?.(offset, offset + limit) || [];

      // fetch works of issues via complex search
      return await Promise.all(
        entries?.map((issue) => resolvePeriodicalIssue(issn, issue, context))
      );
    },
    async subjects(parent, args, context) {
      const filters = parent?.issuesArgs?.filters;
      const issn = parent?.issn;
      const res = await context.datasources.getLoader("periodicalFacets").load({
        issn,
        profile: context.profile,
        facet: "SUBJECT",
        sort: "score",
        sortDirection: "DESC",
        filters,
      });
      return res;
    },
    async publicationYears(parent, args, context) {
      const filters = parent?.issuesArgs?.filters;
      const issn = parent?.issn;
      const res = await context.datasources.getLoader("periodicalFacets").load({
        issn,
        profile: context.profile,
        facet: "PUBLICATIONYEAR",
        sort: "alpha",
        sortDirection: "DESC",
        filters,
      });
      return res;
    },
    async intelligentFacets(parent, args, context) {
      const filters = parent?.issuesArgs?.filters;
      const issn = parent?.issn;
      const multiRes = await Promise.all(
        [
          {
            facet: "PUBLICATIONYEAR",
            sort: "alpha",
            sortDirection: "DESC",
            limit: 1000,
          },
          { facet: "SUBJECT", sort: "score", sortDirection: "DESC", limit: 10 },
        ].map(async (args) => {
          const facetRes = await context.datasources
            .getLoader("periodicalFacets")
            .load({
              issn,
              profile: context.profile,
              facet: args.facet,
              sort: args.sort,
              sortDirection: args.sortDirection,
              filters,
            });
          return { ...facetRes, limit: args.limit };
        })
      );

      return multiRes;
    },
  },
  PeriodicalFacetResponse: {
    entries(parent, args) {
      const rawLimit = args?.limit || parent?.limit;
      const offset = args?.offset || 0;
      const limit = Math.min(
        1000,
        typeof rawLimit === "undefined" ? 10 : rawLimit
      );
      const entries = parent?.entries;

      return entries?.slice?.(offset, offset + limit);
    },
  },
  Periodical: {
    async issues(parent, args, context) {
      return { ...parent, issuesArgs: args };
    },
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
  },
};

export async function resolvePeriodical(issn, context) {
  if (!issn) {
    return null;
  }

  return {
    __typename: "Periodical",
    issn,
    issues: {
      issn,
    },
  };
}

export async function resolvePeriodicalIssue(issn, issue, context) {
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
