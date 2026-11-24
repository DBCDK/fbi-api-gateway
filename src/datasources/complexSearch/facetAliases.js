const families = [
  ["facet.genreform", "facet.genreandform"],
  ["facet.audiencegeneral", "facet.generalaudience"],
];

// Discover capabilities on the actual facet destination, which may differ from
// the search destination. The existing index loader caches by URL and refreshes.
export async function resolveFacetAliases(requested, endpoint, context) {
  const relevant = families.filter((names) =>
    names.some((name) => requested.includes(name))
  );
  const mapping = new Map(requested.map((name) => [name, name]));
  if (relevant.length) {
    const url = endpoint.replace(/\/(?:facets|variants)\/?$/, "");
    const indexes = await context.getLoader("complexIndexes").load({ url });
    const supported = new Set(
      indexes
        .filter((index) => index.facet)
        .flatMap((index) => [index.index, ...(index.aliases || [])])
    );
    for (const [modern, legacy] of relevant) {
      const backendName = supported.has(modern) ? modern : legacy;
      for (const name of [modern, legacy]) {
        if (mapping.has(name)) mapping.set(name, backendName);
      }
    }
  }

  return {
    facets: [...new Set(mapping.values())],
    restore(facets = []) {
      const byName = new Map(facets.map((facet) => [facet.name, facet]));
      return [...mapping].flatMap(([requestedName, backendName]) => {
        // A backend may advertise the modern name as an alias while returning
        // its canonical legacy name. Prefer the requested backend field even
        // when its values are explicitly empty.
        const family = families.find((names) => names.includes(backendName));
        const facet =
          byName.get(backendName) ||
          (family && byName.get(family.find((name) => name !== backendName)));
        return facet ? [{ ...facet, name: requestedName }] : [];
      });
    },
  };
}
