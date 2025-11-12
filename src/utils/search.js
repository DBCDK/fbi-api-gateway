import { mapWikidata } from "./utils";

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
        (value.count === candidate.count && value.firstIndex < candidate.firstIndex)
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

  if (!creatorInfoRaw || (!creatorInfoRaw?.viafId && !creatorInfoRaw?.display)) {
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


