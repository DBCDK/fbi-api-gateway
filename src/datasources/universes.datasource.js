import config from "../config";
const { url, ttl, prefix, teamLabel } = config.datasources.universe;

// These are hardcoded for now
const allowedLanguages = new Set([
  "dansk",
  "engelsk",
  "ukendt sprog",
  "flere sprog",
]);

export async function load({ workId, trackingId = null, profile }, context) {
  const { agency, name } = profile;
  // trackingId can be added to the params by adding /${trackingId} to the end
  const params = `${agency}/${name}/${workId}`;
  // series-service returns 404 if workId is not a part of a serie
  const res = (
    await context?.fetch(`${url}/${params}`, { allowedErrorStatusCodes: [404] })
  ).body;
  if (!res?.universes) {
    return [];
  }

  return {
    universes:
      (await Promise.all(
        res?.universes?.map(async (universe) => {
          // Augment works with workTypes

          const contentWithWorkTypes = (
            await Promise.all(
              universe.content.map(async (entry, index) => {
                // This is a series, it has a workTypes list already
                if (entry.seriesTitle) {
                  return entry;
                }

                const jedRecord = await context
                  .getLoader("jedRecord")
                  .load({
                    id: entry.persistentWorkId,
                    profile,
                  });
                if (!jedRecord) {
                  return null;
                }
                return {
                  ...entry,
                  workTypes: jedRecord.workTypes,
                  mainLanguages: jedRecord.mainLanguages,
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
              return languages?.some((language) =>
                allowedLanguages.has(language)
              );
            });

          const allTypes = {};

          contentWithWorkTypes.forEach(
            ({ workTypes }) => (allTypes[workTypes[0]?.toUpperCase()] = true)
          );

          return {
            ...universe,
            content: contentWithWorkTypes,
            workTypes: Object.keys(allTypes),
          };
        })
      )) || [],
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 48, // 48 hours
  },
};

export { teamLabel };
