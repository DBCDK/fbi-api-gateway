const teamLabel = "febib";

export async function load(
  { issn, profile, facet, sort = "score", sortDirection = "DESC", filters },
  context
) {
  let cql = `term.issn=${issn} AND worktype="Article"`;
  if (filters?.publicationYears?.length > 0) {
    cql += ` AND publicationyear=(${filters?.publicationYears.map((value) => `"${value.replace(/"/g, "")}"`).join(" OR ")})`;
  }
  if (filters?.publicationMonths?.length > 0) {
    cql += ` AND phrase.issue=(${filters?.publicationMonths.map((value) => `"${value.replace(/"/g, "")}"`).join(" OR ")})`;
  }
  if (filters?.subjects?.length > 0) {
    cql += ` AND phrase.subject=(${filters?.subjects.map((value) => `"${value.replace(/"/g, "")}"`).join(" OR ")})`;
  }

  const res = await context.getLoader("complexFacets").load({
    cql,
    facets: [facet],
    facetLimit: 100000,
    profile,
  });

  const subjectsFacets = res.facets?.find((entry) =>
    entry?.name?.includes(facet.toLowerCase())
  );
  const entries = subjectsFacets?.values?.map((entry) => ({
    ...entry,
    term: entry.key,
  }));

  entries.sort((a, b) => {
    let valA, valB;

    if (sort === "alpha") {
      valA = a.term.toLowerCase();
      valB = b.term.toLowerCase();
    } else {
      // default to sorting by score
      valA = a.score;
      valB = b.score;
    }

    if (valA < valB) return sortDirection === "ASC" ? -1 : 1;
    if (valA > valB) return sortDirection === "ASC" ? 1 : -1;
    return 0;
  });

  return { hitcount: entries?.length, entries, facet };
}

export const options = {
  redis: {
    prefix: "periodica-subjects-3",
    ttl: 60 * 60,
  },
};

export { teamLabel };
