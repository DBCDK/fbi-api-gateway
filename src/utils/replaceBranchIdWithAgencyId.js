/**
 *
 * Function to replace the branchId with an agencyId from the userinfo attributes
 *
 * @param {object} attributes
 * @param {object} context
 * @returns {object} userinfo attributes
 */

export default async function replaceBranchIdWithAgencyId(attributes, context) {
  const loader = context?.getLoader || context?.datasources?.getLoader;

  // update used "loggedInBranchId"
  const branchId = attributes?.loggedInAgencyId;
  // get AgencyId from used branchId
  const result = (await loader("library").load({ branchId })).result?.[0];
  // update used loggedInAgencyId
  const agencyId = result?.agencyId;

  const replacedAgencies = attributes?.agencies?.map((a) =>
    a.agencyId === branchId ? { ...a, agencyId } : a
  );

  return {
    ...attributes,
    agencies: replacedAgencies, // user agencies/accounts, where all agencyIds now actually is agencyIds
    loggedInAgencyId: agencyId, // replacement for the smaug 'agency' field
    loggedInBranchId: branchId, // original loggedInagencyId <- which is actually a branchId
  };
}
