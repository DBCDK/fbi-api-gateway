function shouldIncludeAgencyInPath({
  agency,
  defaultAgency,
  alwaysRequireAgencyId,
}) {
  if (!agency) {
    return false;
  }

  if (alwaysRequireAgencyId) {
    return true;
  }

  if (!defaultAgency) {
    return true;
  }

  return agency !== defaultAgency;
}

export function buildGraphQLPath({
  agency,
  defaultAgency,
  alwaysRequireAgencyId,
  profile,
}) {
  if (!profile) {
    return null;
  }

  if (alwaysRequireAgencyId && !agency) {
    return null;
  }

  const encodedProfile = encodeURIComponent(profile);

  if (
    shouldIncludeAgencyInPath({
      agency,
      defaultAgency,
      alwaysRequireAgencyId,
    })
  ) {
    return `/${encodeURIComponent(agency)}/${encodedProfile}/graphql`;
  }

  return `/${encodedProfile}/graphql`;
}
