const teamLabel = "febib";

export async function load({ issn, profile }, context) {
  const res = await context.getLoader("complexFacets").load({
    cql: `term.issn=${issn}`,
    facets: ["SUBJECT"],
    facetLimit: 100000,
    profile,
  });
  const subjectsFacets = res.facets?.find((facet) =>
    facet?.name?.includes("subject")
  );
  const entries = subjectsFacets?.values?.map((entry) => ({
    ...entry,
    term: entry.key,
  }));

  return { hitcount: entries?.length, entries };
}

export const options = {
  redis: {
    prefix: "periodica-subjects-1",
    ttl: 60 * 60,
  },
};

export { teamLabel };
