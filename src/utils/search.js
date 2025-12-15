import { mapWikidata } from "./utils";
import { resolveWork, fetchAndExpandSeries } from "../utils/utils";

export const DEFAULT_TOP_WORKS_LIMIT = 5;

// Weight schedule for author scoring by work rank (top N works)
const WORK_RANK_WEIGHTS = [2, 2, 2, 1, 1];

/**
 * Get the weight for a work index. First work has the highest weight, last work has the lowest weight.
 */
function getWorkRankWeight(index) {
  if (typeof index !== "number" || index < 0) return 0;
  if (index < WORK_RANK_WEIGHTS.length) return WORK_RANK_WEIGHTS[index];
  return 0;
}

/**TODO: rename authors->contributors
 * Extract author entries from works for scoring.
 * - creators with role functionCode === 'aut', 'ill' or 'act'
 * - contributors (from manifestations.all) with functionCode === 'ill' or 'act'
 */
export function getWorkAuthors(works) {
  const allEntries = [];
  (works || []).forEach((work, workIndex) => {
    const creators = Array.isArray(work?.creators)
      ? work.creators
      : [
          ...(work?.creators?.persons || []),
          ...(work?.creators?.corporations || []),
        ];

    const manifestationsAll = Array.isArray(work?.manifestations?.all)
      ? work.manifestations.all
      : [];

    const contributors = manifestationsAll.flatMap((m) =>
      Array.isArray(m?.contributors) ? m.contributors : []
    );

    const creatorAuthors =
      creators
        ?.filter((c) => Array.isArray(c?.roles))
        ?.filter((c) =>
          c.roles?.some?.(
            (r) =>
              r?.functionCode === "aut" ||
              r?.functionCode === "ill" ||
              r?.functionCode === "act"
          )
        ) || [];

    const contributorAuthors =
      contributors
        ?.filter((c) => Array.isArray(c?.roles))
        ?.filter((c) =>
          c.roles?.some?.(
            (r) => r?.functionCode === "ill" || r?.functionCode === "act"
          )
        ) || [];

    // Deduplicate per work so the same person is only scored once per work.
    const seenKeys = new Set();
    const merged = [...creatorAuthors, ...contributorAuthors];

    merged.forEach((c) => {
      const viafid = c?.viafid || null;
      const display = c?.display || null;
      if (!viafid && !display) return;

      const key = viafid
        ? `viaf:${viafid}`
        : `name:${String(display).toLowerCase().trim()}`;

      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      allEntries.push({ key, viafid, display, index: workIndex });
    });
  });

  return allEntries;
}

/**
 * From author entries, select the primary author using weighted-by-rank scoring.
 * Earlier works contribute more to the total score.
 * An author is only selected if it appears in more than 2 works.
 */
export function selectPrimaryAuthor(authorEntries) {
  if (!authorEntries?.length) return null;

  // Stores the total weighted score for each author key.
  // Example: "viaf:123" => 3, "name:john doe" => 4
  const weightedScores = new Map();
  // Stores how many times each author key appears across works.
  const occurrenceCounts = new Map();
  // Stores info about where we first saw each author.
  // Example: "viaf:123" => { viafid: "123", display: "John Doe", firstIndex: 0 }
  const firstEntryByKey = new Map();

  // Iterate over each author entry and update the weighted scores and first entry maps
  for (const { key, viafid, display, index } of authorEntries) {
    if (!firstEntryByKey.has(key)) {
      firstEntryByKey.set(key, { viafid, display, firstIndex: index ?? 0 });
    }

    // Get the weight for this work index. Higher weight for earlier works.
    const weight = getWorkRankWeight(index ?? 0);
    // Update the total score for this author key. If we've seen this key before, add the weight to the existing score.
    const nextScore = (weightedScores.get(key) || 0) + weight;
    const nextCount = (occurrenceCounts.get(key) || 0) + 1;
    // Store the updated score for this author key.
    weightedScores.set(key, nextScore);
    occurrenceCounts.set(key, nextCount);
  }

  // Find the author key with the highest total score.
  let bestKey = null;
  // The highest total score found so far.
  let bestScore = 0;
  // The index of the first work where we saw this author key.
  let bestFirstIndex = Infinity;

  weightedScores.forEach((score, key) => {
    const occurrenceCount = occurrenceCounts.get(key) ?? 0;
    // Only consider authors that appear more than 2 times.
    if (occurrenceCount <= 2) return;

    const first = firstEntryByKey.get(key);
    const firstIndex = first?.firstIndex ?? 0;

    if (
      score > bestScore ||
      (score === bestScore && firstIndex < bestFirstIndex)
    ) {
      bestKey = key;
      bestScore = score;
      bestFirstIndex = firstIndex;
    }
  });

  if (!bestKey) return null;

  const best = firstEntryByKey.get(bestKey);
  return {
    viafid: best?.viafid ?? null,
    display: best?.display ?? null,
    score: bestScore,
  };
}

/**
 * Fetch and map CreatorInfo for a candidate
 */
export async function getCreatorInfo(candidate, context) {
  if (!candidate) return null;

  let creatorInfoRaw = null;

  if (candidate.display) {
    creatorInfoRaw = await context.datasources
      .getLoader("creatorByDisplayName")
      .load({ displayName: candidate.display });
  }
  if (
    !creatorInfoRaw ||
    (!creatorInfoRaw?.viafId && !creatorInfoRaw?.display)
  ) {
    return null;
  }

  const GENERATED_DISCLAIMER =
    "Teksten er automatisk genereret ud fra bibliotekernes materialevurderinger og kan indeholde fejl.";

  const creatorDisplay = creatorInfoRaw?.display || candidate.display || null;
  const hasSummary = !!creatorInfoRaw?.generated?.summary;
  const hasShortSummary = !!creatorInfoRaw?.generated?.shortSummary;

  return {
    display: creatorDisplay,
    firstName: creatorInfoRaw?.original?.firstname || null,
    lastName: creatorInfoRaw?.original?.lastname || null,
    viafid: creatorInfoRaw?.viafId || null,
    wikidata: mapWikidata(creatorInfoRaw),
    generated: creatorDisplay
      ? {
          creator: creatorDisplay,
          summary: hasSummary
            ? {
                text: creatorInfoRaw?.generated?.summary,
                disclaimer: GENERATED_DISCLAIMER,
              }
            : null,
          shortSummary: hasShortSummary
            ? {
                text: creatorInfoRaw?.generated?.shortSummary,
                disclaimer: GENERATED_DISCLAIMER,
              }
            : null,
        }
      : null,
  };
}

/**
 * Resolve a list of workIds to work objects
 * Optionally enrich with searchHits (complex search)
 */
export async function resolveWorksByIds(workIds, context, searchHits) {
  const limitedWorkIds = workIds.slice(0, DEFAULT_TOP_WORKS_LIMIT);
  const works = await Promise.all(
    (limitedWorkIds || []).map(async (id) => {
      try {
        return await resolveWork({ id, searchHits }, context);
      } catch (e) {
        return null;
      }
    })
  );
  return works;
}

/**
 * For a work, fetch series and return a unique list of seriesIds for that work
 */
export async function getSeriesIdsFromWork(work, context) {
  if (!work) return [];
  try {
    const list = await fetchAndExpandSeries(work, context);
    const ids = Array.isArray(list)
      ? list
          .map((s) => s?.seriesId)
          .filter((v) => typeof v === "string" && v.length > 0)
      : [];
    return Array.from(new Set(ids));
  } catch (e) {
    return [];
  }
}

/**
 * Given arrays of seriesIds per work, select a series id
 * that occurs at least minCount times across works.
 */
export function selectPrimarySeriesId(seriesIdsPerWork, minCount = 2) {
  const counts = new Map();

  for (const ids of seriesIdsPerWork ?? []) {
    for (const id of ids ?? []) {
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  let selectedSeriesId = null;
  let bestCount = 0;
  for (const [id, count] of counts.entries()) {
    if (count < minCount) continue;
    if (count > bestCount) {
      bestCount = count;
      selectedSeriesId = id;
    }
  }

  return selectedSeriesId;
}
