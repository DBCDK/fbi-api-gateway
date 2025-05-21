const teamLabel = "febib";

function extractAndRemoveMatch(str, regex) {
  const match = str.match(regex);
  if (!match) {
    return { rest: str, match: null };
  }

  const matchedText = match[0];
  const rest = str.replace(matchedText, "").trim();

  return { rest, match };
}

/**
 * Extracts the relevant numerical values from a given string:
 * - Volume number (årgang)
 * - Issue number (nr.), including ranges like "6/7"
 * - Year (inside parentheses)
 *
 * pjo NOTE - der findes også sådan nogle dimmere: "2024, nr. 13" - det er vel også et volume match
 * pjo NOT - og sådan nogle her: 2001-04-14 - så skal der vel sorteres som dato
 *
 * If a value is missing, it's set to -Infinity to ensure proper sorting (newest first).
 */
function extractNumbers(str) {
  const date = str.match(/^\d{4}-\d{2}-\d{2}$/);
  const volumeMatch = extractAndRemoveMatch(str, /årg\.\s*\b(\d+)\b/);
  const issueMatch = extractAndRemoveMatch(
    volumeMatch.rest,
    /nr\. (\d+)(?:\/(\d+))?/
  );
  const yearMatch = extractAndRemoveMatch(issueMatch.rest, /\(?(\d{4})\)?/);
  // Default to -Infinity for missing values
  const volume = volumeMatch.match ? Number(volumeMatch.match[1]) : -Infinity;
  const issueStart = issueMatch.match ? Number(issueMatch.match[1]) : -Infinity;
  const issueEnd =
    issueMatch.match && issueMatch.match[2]
      ? Number(issueMatch.match[2])
      : issueStart.match;
  const year = yearMatch.match ? Number(yearMatch.match[1]) : -Infinity;

  // Sorting priority: year > volume > issue start > issue end
  return [date, year, volume, issueStart, issueEnd];
}

/**
 * Sorts the data in **reverse order**, meaning the newest entries appear **at the top**.
 * Sorting order:
 * 1. Newest **year** first
 * 2. Highest **volume** first
 * 3. Highest **issue start** first
 * 4. Highest **issue end** first
 */
export function sortIssues(a, b) {
  const [dateA, yearA, volumeA, issueA_start, issueA_end] = extractNumbers(a);
  const [dateB, yearB, volumeB, issueB_start, issueB_end] = extractNumbers(b);

  return (
    (dateA && dateB && new Date(dateB) - new Date(dateA)) || // sort by date (latest first)
    yearB - yearA || // Sort by year (newest first)
    volumeB - volumeA || // Sort by volume (highest first)
    issueB_start - issueA_start || // Sort by issue start (highest first)
    issueB_end - issueA_end // Sort by issue end (highest first)
  );
}

const FILTERS = {
  SUBJECT: "phrase.subject",
  PUBLICATIONYEAR: "publicationyear",
};

export async function load({ issn, profile, filters }, context) {
  let cql = `term.issn=${issn}`;
  filters?.forEach((filter) => {
    cql += ` AND ${FILTERS[filter.key]}=(${filter.values.map((value) => `"${value.replace(/"/g, "")}"`).join(" OR ")})`;
  });

  const res = await context.getLoader("complexFacets").load({
    cql,
    facets: ["ISSUE"],
    facetLimit: 100000,
    profile,
  });

  const issuesFacets = res.facets?.find((facet) =>
    facet?.name?.includes("issue")
  );

  const issueIds = issuesFacets?.values
    ?.map?.((entry) => entry.key)
    ?.sort(sortIssues);

  return { hitcount: issueIds?.length, entries: issueIds };
}

export const options = {
  redis: {
    prefix: "periodica-issues-3",
    ttl: 60 * 60,
  },
};

export { teamLabel };
