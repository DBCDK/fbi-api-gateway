import { mapWikidata } from "./utils";
import { resolveWork, fetchAndExpandSeries } from "../utils/utils";

// Shared constants for hit calculations - top works limit
export const DEFAULT_TOP_WORKS_LIMIT = 5;
// number of works that must share the same author/series to be considered dominant
export const DOMINANT_MIN_COUNT = 3;

/**
 * Extract author entries from works for counting.
 * creators with role functionCode === 'aut'
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

    creators
      ?.filter((c) => Array.isArray(c?.roles))
      ?.filter((c) => c.roles?.some?.((r) => r?.functionCode === "aut"))
      ?.forEach((c) => {
        const viafid = c?.viafid || null;
        const display = c?.display || null;
        if (!viafid && !display) return;
        const key = viafid
          ? `viaf:${viafid}`
          : `name:${String(display).toLowerCase().trim()}`;
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

  const counts = new Map();

  for (const { key, viafid, display } of authorEntries) {
    const nextCount = (counts.get(key) || 0) + 1;
    counts.set(key, nextCount);

    if (nextCount >= DOMINANT_MIN_COUNT) {
      return { viafid, display, count: nextCount };
    }
  }

  return null;
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
export function selectPrimarySeriesId(
  seriesIdsPerWork,
  minCount = DOMINANT_MIN_COUNT
) {
  const counts = new Map();
  (seriesIdsPerWork || []).forEach((ids) => {
    (ids || []).forEach((id) => {
      counts.set(id, (counts.get(id) || 0) + 1);
    });
  });

  let selectedSeriesId = null;
  counts.forEach((count, id) => {
    if (count >= minCount && !selectedSeriesId) {
      selectedSeriesId = id;
    }
  });
  return selectedSeriesId;
}
