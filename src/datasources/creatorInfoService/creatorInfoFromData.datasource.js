/**
 * @file Aggregates expensive creator data operations for hard caching.
 *
 * This datasource combines multiple expensive operations:
 * - Generates a synthetic description for a creator based on their works, subjects, and publication years
 * - Fetches forfatterweb image data from article manifestations
 *
 * All operations are cached together to minimize expensive database and API calls.
 */

import { resolveAccess } from "../../utils/access";
import {
  parseJedSubjects,
  resolveManifestation,
  resolveWork,
} from "../../utils/utils";
import skipImagesData from "./skip-images.json";

/**
 * Create a set of bibdkNames to skip from imported data
 */
const skipImagesSet = new Set(
  skipImagesData.map((entry) => entry.bibdkName).filter((name) => name !== null)
);

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
    primaryPublicationPeriodStartYear:
      dataSummaryResult?.primaryPublicationPeriodStartYear || null,
    forfatterweb,
  };
}

// Functions/roles that are supported for contributor data summary
const supportedContributorFunctions = ["skuespiller", "illustrator"];

async function getDataSummary(creatorDisplayName, profile, context) {
  const cql = `phrase.creator="${creatorDisplayName}" OR ${supportedContributorFunctions.map((role) => `phrase.creatorcontributorfunction="${creatorDisplayName} (${role})"`).join(" OR ")}`;
  const [res, facetsResult] = await Promise.all([
    context.getLoader("complexsearch").load({
      cql,
      profile,
      offset: 0,
      limit: 100,
    }),
    context.getLoader("complexFacets").load({
      cql,
      profile,
      facets: ["publicationyear"],
      facetLimit: 1000,
    }),
  ]);

  const workCount = res.hitcount || 0;
  let dataSummary = null;
  let topSubjects = null;
  let primaryPublicationPeriodStartYear = null;

  if (workCount > 0) {
    // Get year facet values
    const yearFacet = facetsResult?.facets?.find(
      (f) => f.name === "facet.publicationyear"
    );
    const yearValues = yearFacet?.values || [];

    // Calculate estimated start of primary publication period using clustering algorithm
    primaryPublicationPeriodStartYear = getDebutYear(yearValues);

    // Extract years as numbers for date range calculation
    const years = yearValues
      .map((v) => parseInt(v.key, 10))
      .filter((y) => !isNaN(y))
      .sort((a, b) => a - b);

    const usesDebutYear = primaryPublicationPeriodStartYear !== years[0];
    const startYear = primaryPublicationPeriodStartYear;
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
          ? `fra ${startYear}`
          : `i perioden ${startYear} til ${endYear}`;

      const baseSentence = usesDebutYear
        ? `${creatorDisplayName} er registreret som ophav eller bidragsyder til ${workCount} ${
            workCount === 1 ? "udgivelse" : "udgivelser"
          }, fortrinsvis udgivet ${yearText}.`
        : `${creatorDisplayName} er registreret som ophav eller bidragsyder til ${workCount} ${
            workCount === 1 ? "udgivelse" : "udgivelser"
          } ${yearText}.`;

      if (topSubjects && topSubjects.length > 0) {
        // Use first 3 for the text description
        const top3Subjects = topSubjects.slice(0, 3);
        const subjectText = top3Subjects
          .join(", ")
          .replace(/, ([^,]*)$/, " og $1");
        dataSummary = `${baseSentence} ${
          workCount === 1 ? "Udgivelsen" : "Udgivelserne"
        } dækker emner som fx ${subjectText}.`;
      } else {
        dataSummary = baseSentence;
      }
    }
  }

  return {
    dataSummary,
    topSubjects,
    primaryPublicationPeriodStartYear,
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

  // Find the first cluster (chronological) that is "significant":
  // - at least 3 distinct years in the cluster, OR
  // - at least 5 works in total (sum of scores across years).
  for (const cluster of clusters) {
    const yearCount = cluster.length;
    const workCount =
      cluster.reduce(
        (sum, entry) =>
          sum + (typeof entry.value.score === "number" ? entry.value.score : 0),
        0
      ) || 0;

    if (yearCount >= 10 || workCount >= 10) {
      return cluster[0]?.year;
    }
  }

  // If no cluster meets the threshold, fall back to the absolute earliest year.
  return yearEntries[0]?.year;
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
  const clusterGapThreshold = Math.max(medianGap * 3, 20);

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

  // Merge neighboring clusters when the left cluster is already substantial
  // and the gap between them is not too large. This helps avoid splitting the
  // primary publication period into multiple small clusters just because of
  // a moderate pause in publications.
  const mergedClusters = [];
  let i = 0;

  while (i < clusters.length) {
    let current = clusters[i];
    let j = i + 1;

    while (j < clusters.length) {
      const left = current;
      const right = clusters[j];

      const leftYearCount = left.length;
      const leftLastYear = left[left.length - 1]?.year;
      const rightFirstYear = right[0]?.year;
      const gapBetweenClusters =
        typeof leftLastYear === "number" && typeof rightFirstYear === "number"
          ? rightFirstYear - leftLastYear
          : Number.POSITIVE_INFINITY;

      // If the left cluster has more than 3 distinct years and the gap to the
      // next cluster is less than 80 years, treat them as part of the same
      // broader period and merge them.
      if (leftYearCount >= 3 && gapBetweenClusters < 80) {
        current = [...left, ...right];
        j += 1;
      } else {
        break;
      }
    }

    mergedClusters.push(current);
    i = j;
  }

  return mergedClusters;
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
      const contextForResolver = {
        profile,
        datasources: { getLoader: context.getLoader },
      };
      const manifestation = await resolveManifestation(
        { pid },
        contextForResolver
      );
      const access = await resolveAccess(manifestation, contextForResolver);
      await Promise.all(
        access.map(async (entry) => {
          entry.status = await entry.status;
        })
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
      return { manifestation, image, access };
    })
  );
  const image = resolvedManifestations.find((m) => m.image)?.image;
  let urls = [];
  resolvedManifestations.forEach((m) => {
    const accessUrls = m?.access;
    if (Array.isArray(accessUrls) && accessUrls.length > 0) {
      urls = [...urls, ...accessUrls.filter((entry) => entry.status === "OK")];
    }
  });
  // Check if creatorDisplayName is in skip images list and set image to null if so
  const finalImage = skipImagesSet.has(creatorDisplayName) ? null : image;

  return { image: finalImage, url: urls?.[0]?.url };
}

// export const options = {
//   redis: {
//     prefix: "creatorInfoFromData-15",
//     ttl: 60 * 60 * 24,
//     staleWhileRevalidate: 60 * 60 * 24 * 7, // A week
//   },
// };
const teamLabel = "febib";
export { teamLabel };
