/**
 * @file Aggregates expensive creator data operations for hard caching.
 *
 * This datasource combines multiple expensive operations:
 * - Generates a synthetic description for a creator based on their works, subjects, and publication years
 * - Fetches forfatterweb image data from article manifestations
 *
 * All operations are cached together to minimize expensive database and API calls.
 */

import {
  parseJedSubjects,
  resolveManifestation,
  resolveWork,
} from "../utils/utils";

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
    debutYear: dataSummaryResult?.debutYear || null,
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
  let debutYear = null;

  if (workCount > 0) {
    // Get year facet values
    const yearFacet = facetsResult?.facets?.find(
      (f) => f.name === "facet.publicationyear"
    );
    const yearValues = yearFacet?.values || [];

    // Calculate debut year using clustering algorithm
    debutYear = getDebutYear(yearValues);

    // Extract years as numbers for date range calculation
    const years = yearValues
      .map((v) => parseInt(v.key, 10))
      .filter((y) => !isNaN(y))
      .sort((a, b) => a - b);

    const startYear = debutYear;
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
    debutYear,
  };
}

/**
 * Calculates the debut year for a creator by clustering publication years and identifying outliers.
 *
 * Uses a clustering algorithm to group years based on gaps between consecutive publications.
 * Years with large gaps (outliers, likely incorrect registrations) are filtered out,
 * and the debut year is determined as the earliest year in the main cluster of publications.
 *
 * @param {Array<{key: string, score?: number}>} years - Array of year objects with a 'key' property containing the year as a string,
 *   and optionally a 'score' property for weighting. Typically from facet values.
 *
 * @returns {number|undefined} The calculated debut year (earliest year in main cluster), or undefined if no valid years
 *
 * @example
 * // With years: [2000, 2001, 2002, 1950, 2003, 2004]
 * // The function would cluster: [2000-2004] as main, [1950] as outlier
 * // Returns: 2000
 */
function getDebutYear(years) {
  // Convert to numeric years and sort ascending
  const yearEntries = years
    ?.map((y) => ({
      year: Number(y.key),
      value: y,
    }))
    ?.filter((entry) => !Number.isNaN(entry.year))
    ?.sort((a, b) => a.year - b.year);

  if (!yearEntries?.length) {
    return null;
  }

  // For very few years, don't try to be clever – just return the first year
  if (yearEntries.length <= 10) {
    return yearEntries[0]?.year;
  }

  // Cluster years based on gaps
  const clusters = clusterYears(yearEntries);

  // If only one cluster, all years are normal
  if (clusters.length === 1) {
    return clusters[0][0]?.year;
  }

  // Find the main cluster (largest by size, then by score)
  const mainCluster = findMainCluster(clusters);
  return mainCluster[0]?.year;
}

function clusterYears(yearEntries) {
  // Compute gaps between consecutive years
  const gaps = [];
  for (let i = 1; i < yearEntries.length; i++) {
    gaps.push(yearEntries[i].year - yearEntries[i - 1].year);
  }

  // Compute median gap
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const mid = Math.floor(sortedGaps.length / 2);
  const medianGap =
    sortedGaps.length % 2 === 0
      ? (sortedGaps[mid - 1] + sortedGaps[mid]) / 2
      : sortedGaps[mid];

  // A "cluster gap" is a gap larger than "normal" jump
  // Use both a relative factor and an absolute threshold
  const clusterGapThreshold = Math.max(medianGap * 3, 15);

  // Build clusters: each time we see a large gap, start a new cluster
  const clusters = [];
  let currentCluster = [yearEntries[0]];

  for (let i = 1; i < yearEntries.length; i++) {
    const gap = yearEntries[i].year - yearEntries[i - 1].year;
    if (gap > clusterGapThreshold) {
      clusters.push(currentCluster);
      currentCluster = [yearEntries[i]];
    } else {
      currentCluster.push(yearEntries[i]);
    }
  }
  if (currentCluster.length) {
    clusters.push(currentCluster);
  }

  return clusters;
}

function findMainCluster(clusters) {
  let mainClusterIndex = 0;
  let mainClusterSize = clusters[0].length;
  let mainClusterScore =
    clusters[0].reduce(
      (sum, entry) =>
        sum + (typeof entry.value.score === "number" ? entry.value.score : 0),
      0
    ) || 0;

  for (let i = 1; i < clusters.length; i++) {
    const size = clusters[i].length;
    const score =
      clusters[i].reduce(
        (sum, entry) =>
          sum + (typeof entry.value.score === "number" ? entry.value.score : 0),
        0
      ) || 0;

    if (size > mainClusterSize) {
      mainClusterIndex = i;
      mainClusterSize = size;
      mainClusterScore = score;
    } else if (size === mainClusterSize && score > mainClusterScore) {
      mainClusterIndex = i;
      mainClusterSize = size;
      mainClusterScore = score;
    }
  }

  return clusters[mainClusterIndex];
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
    limit: 10,
    sort: [{ index: "sort.latestpublicationdate", order: "DESC" }],
  });

  const pids = [];
  forfatterwebSearch?.works?.forEach((id) => {
    pids.push(forfatterwebSearch?.searchHits?.[id]?.[0]);
  });

  const resolvedManifestations = await Promise.all(
    pids.map(async (pid) => {
      const manifestation = await resolveManifestation(
        { pid },
        { profile, datasources: { getLoader: context.getLoader } }
      );
      const cover = await context.getLoader("fbiinfoCovers").load(pid);
      const coverResources = cover?.resources;
      const image = coverResources
        ? {
            xSmall: coverResources["120px"] || null,
            small: coverResources["240px"] || null,
            medium: coverResources["480px"] || null,
            large: coverResources["960px"] || null,
            original: coverResources["original"] || null,
          }
        : null;
      return { manifestation, image };
    })
  );

  const image = resolvedManifestations.find((m) => m.image)?.image;
  const url = resolvedManifestations.find(
    (m) => m?.manifestation?.access?.accessUrls?.[0]?.url
  )?.manifestation?.access?.accessUrls?.[0]?.url;

  return { image, url };
}

export const options = {
  redis: {
    prefix: "creatorInfoFromData-6",
    ttl: 60 * 60 * 24,
    staleWhileRevalidate: 60 * 60 * 24 * 7, // A week
  },
};
const teamLabel = "febib";
export { teamLabel };
