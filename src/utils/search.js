import { mapWikidata } from "./utils";
import { resolveWork, fetchAndExpandSeries } from "../utils/utils";

// Shared constants for hit calculations - top works limit
export const DEFAULT_TOP_WORKS_LIMIT = 5;

// Weight schedule for author scoring by work index (top N works)
// Earlier works get strictly higher weights
const WORK_INDEX_WEIGHTS = [5, 3, 2, 1, 1];

function getWorkIndexWeight(index) {
  if (typeof index !== "number" || index < 0) return 0;
  if (index < WORK_INDEX_WEIGHTS.length) return WORK_INDEX_WEIGHTS[index];
  // Only the top WORK_INDEX_WEIGHTS.length works contribute to the score
  return 0;
}

/**
 * Extract author entries from works for counting.
 * - creators with role functionCode === 'aut'
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

    //find illustrators and actors from manifestations.all
    const contributorAuthors =
      contributors
        ?.filter((c) => Array.isArray(c?.roles))
        ?.filter((c) =>
          c.roles?.some?.(
            (r) => r?.functionCode === "ill" || r?.functionCode === "act"
          )
        ) || [];

    // Deduplicate per work so the same person (creator or contributor)
    // is only counted once per work, even if present in multiple manifestations.
    const seenKeys = new Set();
  const merged= [...creatorAuthors, ...contributorAuthors];
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
 * From author entries, compute counts and pick a dominant author (>=3)
 */
export function selectPrimaryAuthor(authorEntries) {

  if (!authorEntries?.length) return null;

  // key -> total weighted score
  const scores = new Map();
  // key -> { viafid, display, firstIndex }
  const firstEntryByKey = new Map();

  for (const { key, viafid, display, index } of authorEntries) {
    if (!firstEntryByKey.has(key)) {
      firstEntryByKey.set(key, { viafid, display, firstIndex: index ?? 0 });
    }

    const weight = getWorkIndexWeight(index);
    const nextScore = (scores.get(key) || 0) + weight;
    scores.set(key, nextScore);
  }

  // Select primary creator by:
  // 1) highest total weighted score
  // 2) tie-breaker: earliest appearance in the works list
  let bestKey = null;
  let bestScore = 0;
  let bestFirstIndex = Infinity;

  scores.forEach((score, key) => {
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
    count: bestScore,
  };
}

/**
 * Fetch and map CreatorInfo for a candidate
 */
export async function getCreatorInfo(candidate, context) {
  if (!candidate) return null;

  let creatorInfoRaw = null;
  if (candidate.viafid) {
    creatorInfoRaw = await context.datasources
      .getLoader("creatorByViafid")
      .load({ viafid: candidate.viafid });
  } else if (candidate.display) {
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

  //Todo: add somewhere more central/readable
  const GENERATED_DISCLAIMER =
    "Teksten er automatisk genereret ud fra bibliotekernes materialevurderinger og kan indeholde fejl.";

  return {
    display: creatorInfoRaw?.display,
    firstName: creatorInfoRaw?.original?.firstname || null,
    lastName: creatorInfoRaw?.original?.lastname || null,
    viafid: creatorInfoRaw?.viafId || null,
    wikidata: mapWikidata(creatorInfoRaw),
    generated: creatorInfoRaw?.generated?.shortSummary
      ? {
          summary: {
            text: creatorInfoRaw?.generated?.summary,
            disclaimer: GENERATED_DISCLAIMER,
          },
          shortSummary: {
            text: creatorInfoRaw?.generated?.shortSummary,
            disclaimer: GENERATED_DISCLAIMER,
          },
        }
      : null,
  };
}

/**
 * Resolve a list of workIds to work objects
 * Optionally enrich with searchHits (complex search)
 */
export async function resolveWorksByIds(workIds, context, searchHits) {
  //only resolve the top 5 workIds
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
 * Given arrays of seriesIds per work, select a dominant series id
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

    // pick highest count; tie-breaker: keep the first encountered (stable)
    if (count > bestCount) {
      bestCount = count;
      selectedSeriesId = id;
    }
  }

  return selectedSeriesId;
}
