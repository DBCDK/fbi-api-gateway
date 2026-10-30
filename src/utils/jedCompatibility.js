// Prefer the new JED representation, including explicitly empty lists.
// Keep both GraphQL representations available while JED 1.3 and 2.0 coexist.
export function resolveGenreForm(parent) {
  return (
    parent?.genreForm ??
    parent?.genreAndForm?.map((display) => ({ display })) ??
    []
  );
}

export function resolveGenreAndForm(parent) {
  return (
    parent?.genreForm
      ?.map((entry) => entry.display)
      .filter((display) => display != null) ??
    parent?.genreAndForm ??
    []
  );
}
