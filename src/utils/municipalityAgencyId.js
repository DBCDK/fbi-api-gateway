export function setMunicipalityAgencyId(attr) {
  const { municipality, municipalityAgencyId } = attr;

  // No municipality attribute, nothing to do here then.
  if (!municipality) {
    return municipalityAgencyId;
  }

  // Normal folk library
  if (municipalityAgencyId.startsWith("7")) {
    return municipalityAgencyId;
  }

  // faorer or greenland agency
  if (municipalityAgencyId.startsWith("9")) {
    if (municipality.length === 4) {
      return municipalityAgencyId;
    }
  }

  // build from municipality (catches FFU libraries overriding municipalityAgencyId)
  return `7${municipality}00`;
}
