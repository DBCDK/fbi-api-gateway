function normalizeAgencies(agencies) {
  if (Array.isArray(agencies)) {
    return agencies;
  }

  if (typeof agencies === "string") {
    return [agencies];
  }

  return [];
}

export function getAvailableAgencies(configuration) {
  const agencies = normalizeAgencies(configuration?.agencies)
    .filter(Boolean)
    .map((agency) => String(agency))
    .filter((agency, index, array) => array.indexOf(agency) === index);

  if (configuration?.defaultAgency) {
    const defaultAgency = String(configuration.defaultAgency);

    if (!agencies.includes(defaultAgency)) {
      agencies.unshift(defaultAgency);
    }
  }

  return agencies;
}

export function hasAvailableAgency(configuration) {
  return getAvailableAgencies(configuration).length > 0;
}
