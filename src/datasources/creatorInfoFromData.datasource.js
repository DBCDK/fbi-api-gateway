/**
 * @file Aggregates expensive creator data operations for hard caching.
 *
 * This datasource combines multiple expensive operations:
 * - Generates a synthetic description for a creator based on their works, subjects, and publication years
 * - Fetches forfatterweb image data from article manifestations
 *
 * All operations are cached together to minimize expensive database and API calls.
 */

import { parseJedSubjects, resolveWork } from "../utils/utils";

/**
 * Normalize letters by converting to lowercase and removing diacritics
 * Similar to the normalizeLetters function used in the frontend
 */
function normalizeLetters(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s/g, "-");
}

/**
 * Returns a synthetic description for a creator based on their works, subjects, and publication years.
 * Ex.:
 * Test Testesen er registreret som ophav til 194 værker udgivet mellem 2013 og 2025.
 * Værkerne omfatter emner som software, internet og Windows.
 */
export async function load({ creatorDisplayName, profile }, context) {
  const [dataSummaryResult, forfatterweb] = await Promise.all([
    getDataSummary(creatorDisplayName, profile, context),
    getForfatterweb(creatorDisplayName, profile, context),
  ]);

  return {
    dataSummary: dataSummaryResult?.dataSummary || null,
    topSubjects: dataSummaryResult?.topSubjects || null,
    forfatterweb,
  };
}

async function getDataSummary(creatorDisplayName, profile, context) {
  const [res, facetsResult] = await Promise.all([
    context.getLoader("complexsearch").load({
      cql: `phrase.creator="${creatorDisplayName}"`,
      profile,
      offset: 0,
      limit: 100,
    }),
    context.getLoader("complexFacets").load({
      cql: `phrase.creator="${creatorDisplayName}"`,
      profile,
      facets: ["publicationyear"],
      facetLimit: 1000,
    }),
  ]);

  const workCount = res.hitcount || 0;
  let dataSummary = null;
  let topSubjects = null;

  if (workCount > 0) {
    // Extract years
    const years =
      facetsResult?.facets
        ?.find((f) => f.name === "facet.publicationyear")
        ?.values?.map((v) => parseInt(v.key, 10))
        ?.filter((y) => !isNaN(y))
        ?.sort((a, b) => a - b) || [];

    const startYear = years[0];
    const endYear = years[years.length - 1];

    if (startYear && endYear) {
      // Get and filter works
      const resolvedResults = await Promise.all(
        res.works.map((id) =>
          resolveWork(
            { id },
            { profile, datasources: { getLoader: context.getLoader } }
          )
        )
      );

      const noArticles = resolvedResults.filter((w) =>
        w?.workTypes?.includes("LITERATURE")
      );
      const works = noArticles.length > 10 ? noArticles : resolvedResults;

      // Extract top subjects
      topSubjects = extractTopSubjects(works, creatorDisplayName);

      // Generate description
      const yearText =
        startYear === endYear
          ? `udgivet i ${startYear}`
          : `udgivet mellem ${startYear} og ${endYear}`;

      const baseSentence = `${creatorDisplayName} er registreret som ophav til ${workCount} ${
        workCount === 1 ? "værk" : "værker"
      } ${yearText}.`;

      if (topSubjects && topSubjects.length > 0) {
        // Use first 3 for the text description
        const top3Subjects = topSubjects.slice(0, 3);
        const subjectText = top3Subjects
          .join(", ")
          .replace(/, ([^,]*)$/, " og $1");
        dataSummary = `${baseSentence} ${
          workCount === 1 ? "Værket" : "Værkerne"
        } omfatter emner som ${subjectText}.`;
      } else {
        dataSummary = baseSentence;
      }
    }
  }

  return {
    dataSummary,
    topSubjects,
  };
}

function extractTopSubjects(works, creatorDisplayName) {
  const normalizedCreator = normalizeLetters(creatorDisplayName);
  const subjectsMap = {};

  works.forEach((w) => {
    parseJedSubjects(w?.subjects?.dbcVerified)
      ?.filter(
        (s) =>
          (s?.__typename === "SubjectText" || s?.__typename === "Mood") &&
          normalizeLetters(s?.display) !== normalizedCreator
      )
      .forEach((s) => {
        const normalized = normalizeLetters(s?.display);
        if (!subjectsMap[normalized]) {
          subjectsMap[normalized] = { key: s?.display, count: 0 };
        }
        subjectsMap[normalized].count++;
      });
  });

  const topSubjects = Object.values(subjectsMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map((s) => s.key);

  return topSubjects.length > 0 ? topSubjects : null;
}

async function getForfatterweb(creatorDisplayName, profile, context) {
  const forfatterwebSearch = await context.getLoader("complexsearch").load({
    cql: `worktype=article AND phrase.subject="${creatorDisplayName}" AND phrase.hostpublication="Forfatterweb"`,
    profile,
    offset: 0,
    limit: 1,
  });
  const pid =
    forfatterwebSearch?.searchHits?.[forfatterwebSearch?.works?.[0]]?.[0];
  let image = null;

  if (pid) {
    // Get cover data directly using the PID from searchHits
    const cover = await context.getLoader("fbiinfoCovers").load(pid);

    const coverResources = cover?.resources;
    if (coverResources) {
      // Map cover resources to FbiInfoImages format
      image = {
        xSmall: coverResources["120px"] || null,
        small: coverResources["240px"] || null,
        medium: coverResources["480px"] || null,
        large: coverResources["960px"] || null,
        original: coverResources["original"] || null,
      };
    }
  }

  return image ? { image } : null;
}

export const options = {
  redis: {
    prefix: "creatorInfoFromData-3",
    ttl: 60 * 60 * 24,
    staleWhileRevalidate: 60 * 60 * 24 * 7, // A week
  },
};
const teamLabel = "febib";
export { teamLabel };
