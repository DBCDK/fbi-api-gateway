import { filterAgenciesByProps } from "./accounts";

/**
 *
 * This function removes culr data from userinfo response
 * Note that this is done on attributes level
 *
 * @param {object} data
 * @returns {object}
 */
export default function omitCulrData(attributes) {
  const loggedInAgencyId = attributes?.loggedInAgencyId;
  const agencies = attributes?.agencies;

  const filteredAgencies = filterAgenciesByProps(agencies, {
    agency: loggedInAgencyId,
  });

  return {
    ...attributes,
    uniqueId: null,
    agencies: filteredAgencies,
    municipality: null,

    // default behavior for FFU libraries in /userinfo
    municipalityAgencyId: loggedInAgencyId,

    // omitted culr data flags
    omittedCulrData: {
      hasOmittedCulrUniqueId: !!attributes?.uniqueId,
      hasOmittedCulrMunicipality: !!attributes?.municipality,
      hasOmittedCulrMunicipalityAgencyId: !!attributes?.municipalityAgencyId,
      hasOmittedCulrAccounts:
        attributes?.agencies.length > filteredAgencies.length,
    },
  };
}
