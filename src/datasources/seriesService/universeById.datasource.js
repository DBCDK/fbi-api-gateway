//returns a universe by universeId

import config from "../../config";

const { url, ttl, prefix , teamLabel } = config.datasources.seriesService;
const { url: jedUrl  } = config.datasources.jed;
const allowedLanguages = new Set([
  "dansk",
  "engelsk",
  "ukendt sprog",
  "flere sprog",
]);
const WORKTYPES_QUERY = `query($id: String! ) {
    work(id: $id) {
      workTypes
      mainLanguages {
        display
      }
    }
  }
  `;

export async function load(
  { universeId, trackingId = null, profile },
  context
) {
  const { agency, name } = profile;
  const params = `universes/${agency}/${name}/${universeId}`;

  const res = (
    await context?.fetch(`${url}${params}`, { allowedErrorStatusCodes: [404] })
  ).body;
  if (res.status === 404 || !res.universe) {
    return null;
  }
  return await (async () => {
    const universe = res?.universe;

    if (!universe) {
      return null;
    }
    // Augment works with workTypes
    const contentWithWorkTypes = (
      await Promise.all(
        universe.content.map(async (entry, index) => {
          // This is a series, it has a workTypes list already
          if (entry.seriesTitle) {
            return entry;
          }

          // Fetch workTypes via jed graphql for a single work
          // This is way faster than fetching via the REST endpoint
          const jedRes = await context?.fetch(`${jedUrl}/graphql`, {
            method: "POST",
            body: JSON.stringify({
              query: WORKTYPES_QUERY,
              variables: {
                profile: `${agency}-${name}`,
                id: entry.persistentWorkId,
              },
            }),
            allowedErrorStatusCodes: [404, 500],
          });

          if (!jedRes?.body?.data?.work) {
            return null;
          }

          return {
            ...entry,
            ...jedRes?.body?.data?.work,
          };
        })
      )
    )
      .filter((entry) => !!entry)
      .filter((entry) => {
        // Check language is allowed
        const languages = entry.language
          ? [entry.language]
          : entry.mainLanguages?.map(({ display }) => display);

        if (!languages?.length) {
          // Unknown language, keep it
          return true;
        }

        return languages?.some((language) => allowedLanguages.has(language));
      });

    const allTypes = {};

    contentWithWorkTypes.forEach(
      ({ workTypes }) => (allTypes[workTypes[0]?.toUpperCase()] = true)
    );

    return {
      ...universe,
      content: contentWithWorkTypes,
      workTypes: Object.keys(allTypes) || [],
    };
  })();
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 48, // 48 hours
  },
};
