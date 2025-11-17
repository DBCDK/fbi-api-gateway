import { mapWikidata } from "./utils";
import { resolveWork, fetchAndExpandSeries } from "../utils/utils";
import { createTraceId } from "../utils/trace";

/**
 * Extract author entries from works for counting.
 * Considers persons with role functionCode === 'aut'
 */
export function collectAuthorEntriesFromWork(work, workIndex) {
  const creators = Array.isArray(work?.creators)
    ? work.creators
    : [
        ...(work?.creators?.persons || []),
        ...(work?.creators?.corporations || []),
      ];

  const entries = [];
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
      entries.push({ key, viafid, display, index: workIndex });
    });

  return entries;
}

/**
 * From author entries, compute counts and pick a dominant author (>=3)
 */
export function selectDominantAuthor(authorEntries) {
  if (!authorEntries?.length) return null;

  const counts = new Map();
  authorEntries.forEach(({ key, viafid, display, index }) => {
    if (!counts.has(key)) {
      counts.set(key, { viafid, display, count: 0, firstIndex: index });
    }
    const entry = counts.get(key);
    entry.count += 1;
    if (index < entry.firstIndex) entry.firstIndex = index;
  });

  let candidate = null;
  counts.forEach((value) => {
    if (value.count >= 3) {
      if (
        !candidate ||
        value.count > candidate.count ||
        (value.count === candidate.count &&
          value.firstIndex < candidate.firstIndex)
      ) {
        candidate = value;
      }
    }
  });

  return candidate;
}

/**
 * Fetch and map CreatorInfo for a candidate
 */
export async function fetchCreatorInfoForCandidate(candidate, context) {
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

// Shared constants for hit calculations - top works limit
export const DEFAULT_TOP_WORKS_LIMIT = 5;
// number of works that must share the same author/series to be considered dominant
export const DOMINANT_MIN_COUNT = 3;

/**
 * Load top workIds from simple search
 */
export async function getTopWorkIdsFromSimpleSearch(
  parent,
  context,
  limit = DEFAULT_TOP_WORKS_LIMIT
) {
  const res = await context.datasources.getLoader("simplesearch").load({
    ...parent,
    offset: 0,
    limit,
    profile: context.profile,
  });
  const top = Array.isArray(res?.result) ? res.result.slice(0, limit) : [];
  return top.map(({ workid }) => workid).filter(Boolean);
}

/**
 * Load top workIds (and searchHits) from complex search
 */
export async function getTopWorkIdsFromComplexSearch(
  parent,
  context,
  limit = DEFAULT_TOP_WORKS_LIMIT
) {
  const res = await context.datasources.getLoader("complexsearch").load({
    offset: 0,
    limit,
    cql: parent.cql,
    profile: context.profile,
    filters: parent.filters,
    facets: parent?.facets?.facets,
    facetLimit: parent?.facets?.facetLimit,
    includeFilteredPids: parent?.includeFilteredPids || false,
  });
  return { workIds: res?.works || [], searchHits: res?.searchHits };
}

/**
 * Resolve a list of workIds to work objects
 * Optionally enrich with searchHits (complex search)
 */
export async function resolveWorksByIds(workIds, context, searchHits) {
  const works = await Promise.all(
    (workIds || []).map(async (id) => {
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
export async function collectSeriesIdsPerWork(work, context) {
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
export function selectDominantSeriesId(
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

/**
 * Load a Series by id and shape for API response, including traceId
 */
export async function loadSeriesById(seriesId, context) {
  if (!seriesId) return null;
  const seriesById = await context.datasources
    .getLoader("seriesById")
    .load({ seriesId, profile: context.profile });
  if (!seriesById) return null;
  return {
    ...seriesById,
    seriesId,
    traceId: createTraceId(),
  };
}
