import { isFFUAgency } from "./agency";

export async function setMunicipalityAgencyId(attr, context) {
  const { uniqueId, agencies, municipality, municipalityAgencyId } = attr;

  // If FFU user - Replace municipalityAgencyId with agencyId - (OBS! NOT FOLk library connected)
  // solves that KB also gets digital article service (as solved in hejmdal/adgangsplatformen)
  if (!uniqueId) {
    if (!municipalityAgencyId) {
      if (agencies?.length === 1) {
        const agency = agencies?.[0]?.agencyId;

        if (agency && (await isFFUAgency(agency, context))) {
          return agency;
        }
      }
    }
  }

  // No municipality attribute, nothing more to do here then.
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

  // build from municipality (catches FFU libraries overriding municipalityAgencyId - OBS! FOLK library connected)
  return `7${municipality}00`;
}
