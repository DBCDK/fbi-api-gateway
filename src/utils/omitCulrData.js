import { filterAgenciesByProps, filterAccountsByProps } from "./accounts";

/**
 *
 * This function removes culr data from userinfo response
 * Required for FFU agencies - for security reasons
 * Note that this is done on attributes level
 *
 * @param {object} attributes
 * @returns {object}
 */
export function omitUserinfoCulrData(attributes) {
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
        attributes?.agencies?.length > filteredAgencies.length,
    },
  };
}

/**
 *
 * This function removes unwanted culr data from culr response
 * Required for FFU agencies - for security reasons
 *
 * @param {object} user
 * @param {string} user.userId
 * @param {string} user.agencyId
 *
 * @returns {object}
 */
export function omitCulrData(data, user) {
  const filteredAccounts = filterAccountsByProps(data?.accounts, {
    id: user.userId,
    agency: user.agencyId,
  });

  return {
    ...data,
    guid: null,
    municipalityNo: null,
    accounts: filteredAccounts,
    omittedCulrData: {
      hasOmittedCulrGuid: !!data?.guid,
      hasOmittedCulrMunicipalityNo: !!data?.municipalityNo,
      hasOmittedCulrAccounts: data?.accounts?.length > filteredAccounts.length,
    },
  };
}
