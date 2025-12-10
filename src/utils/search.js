import { mapWikidata } from "./utils";
import { resolveWork, fetchAndExpandSeries } from "../utils/utils";

// Shared constants for hit calculations - top works limit
export const DEFAULT_TOP_WORKS_LIMIT = 5;
// number of works that must share the same author/series to be considered dominant
export const DOMINANT_MIN_COUNT = 3;

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
  console.log("\n\n\n\n\ngetWorkAuthors.merged", merged, "\n\n\n\n\n");
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
  console.log("\n\n\n\n\ngetWorkAuthors.allEntries", allEntries, "\n\n\n\n\n");
  return allEntries;
}

/**
 * From author entries, compute counts and pick a dominant author (>=3)
 */
export function selectPrimaryAuthor(authorEntries) {
  console.log(
    "\n\n\n\n\nselectPrimaryAuthor.authorEntries",
    authorEntries,
    "\n\n\n\n\n"
  );
  if (!authorEntries?.length) return null;

  const counts = new Map(); // key -> count
  const firstEntryByKey = new Map(); // key -> { viafid, display, firstIndex }
  let dominantCandidate = null;

  for (const { key, viafid, display, index } of authorEntries) {
    if (!firstEntryByKey.has(key)) {
      firstEntryByKey.set(key, { viafid, display, firstIndex: index ?? 0 });
    }

    const nextCount = (counts.get(key) || 0) + 1;
    counts.set(key, nextCount);

    if (!dominantCandidate && nextCount >= DOMINANT_MIN_COUNT) {
      const first = firstEntryByKey.get(key);
      dominantCandidate = {
        viafid: first.viafid,
        display: first.display,
        count: nextCount,
      };
    }
  }
  console.log("\n\n\n\n\ndominantCandidate", dominantCandidate, "\n\n\n\n\n");
  // 1st priority: dominant author across works
  if (dominantCandidate) {
    return dominantCandidate;
  }

  // 2nd priority: most frequent person across works
  // 3rd priority (tie-breaker): earliest appearance in the works list
  let bestKey = null;
  let bestCount = 0;
  let bestFirstIndex = Infinity;

  // Walk through all keys and pick the "best" one:
  // - Prefer higher total count across works
  // - For equal counts, prefer the one that appeared in an earlier work

  console.log("\n\n\n\n\ncounts", counts, "\n\n\n\n\n");
  counts.forEach((count, key) => {
    // We stored the first index where this key appeared when building `firstEntryByKey`
    const first = firstEntryByKey.get(key);
    const firstIndex = first?.firstIndex ?? 0;

    if (
      count > bestCount ||
      (count === bestCount && firstIndex < bestFirstIndex)
    ) {
      bestKey = key;
      bestCount = count;
      bestFirstIndex = firstIndex;
    }
  });
  console.log("\n\n\n\n\nbestKey", bestKey, "\n\n\n\n\n");
  if (!bestKey) return null;

  const best = firstEntryByKey.get(bestKey);
  console.log("\n\n\n\n\nbest", best, "\n\n\n\n\n");
  return {
    viafid: best?.viafid ?? null,
    display: best?.display ?? null,
    count: bestCount,
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
