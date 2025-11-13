/**
 * @file Generates a synthetic description for a creator based on their works, subjects, and publication years.
 * The description includes work count, publication year range, and top subjects.
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
  if (workCount === 0) return null;

  // Extract years
  const years =
    facetsResult?.facets
      ?.find((f) => f.name === "facet.publicationyear")
      ?.values?.map((v) => parseInt(v.key, 10))
      ?.filter((y) => !isNaN(y))
      ?.sort((a, b) => a - b) || [];

  const startYear = years[0];
  const endYear = years[years.length - 1];
  if (!startYear || !endYear) return null;

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

  // Collect subjects
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
    .slice(0, 3)
    .map((s) => s.key);

  // Generate description
  const yearText =
    startYear === endYear
      ? `udgivet i ${startYear}`
      : `udgivet mellem ${startYear} og ${endYear}`;

  const baseSentence = `${creatorDisplayName} er registreret som ophav til ${workCount} ${
    workCount === 1 ? "værk" : "værker"
  } ${yearText}.`;

  if (topSubjects.length === 0) return baseSentence;

  const subjectText = topSubjects.join(", ").replace(/, ([^,]*)$/, " og $1");
  return `${baseSentence} ${
    workCount === 1 ? "Værket" : "Værkerne"
  } omfatter emner som ${subjectText}.`;
}

export const options = {
  redis: {
    prefix: "creatorDescriptionFromData-1",
    ttl: 60 * 60 * 24,
    staleWhileRevalidate: 60 * 60 * 24 * 7, // A week
  },
};
const teamLabel = "febib";
export { teamLabel };
