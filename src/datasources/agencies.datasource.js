import groupBy from "lodash/groupBy";
import sum from "lodash/sum";

function parseAgencyList(agencyList) {
  return agencyList.map((agency) => {
    return {
      agencyId: agency.agencyId,
      agencyName: agency.agencyName,
      agencyPhone: agency.agencyPhone,
      agencyEmail: agency.agencyEmail,
      highlights: agency.highlights || [],
      branchCount: agency.branchCount,
      branchIds: agency.branchIds,
      agencyBranches:
        agency?.branches?.map((branch) => {
          return {
            agencyId: agency.agencyId,
            agencyName: agency.agencyName,
            branchId: branch.branchId,
            branchName: branch.branchName || [],
            branchShortName: branch.branchShortName || [],
            branchPhone: branch.branchPhone,
            branchEmail: branch.branchEmail,
            branchIllEmail: branch.branchIllEmail,
            city: branch.city,
            geolocation: branch.geolocation,
            highlights: branch.highlights || [],
            openingHours: branch.openingHours || [],
            postalAddress: branch.postalAddress,
            postalCode: branch.postalCode,
          };
        }) || [],
    };
  });
}

export async function load(
  {
    q,
    status = "ALLE",
    limit = 10,
    offset = 0,
    language = "da",
    bibdkExcludeBranches = true,
  },
  context
) {
  const librariesFound = await context.getLoader("library").load({
    q: q,
    status: status,
    limit: limit,
    offset: offset,
    language: language,
    bibdkExcludeBranches: bibdkExcludeBranches,
  });

  const groupedByAgency = groupBy(librariesFound?.result, "agencyId");

  const agenciesFlat = Object.values(groupedByAgency)?.map((branches) => {
    return {
      agencyId: branches?.map((e) => e.agencyId)?.[0],
      agencyName: branches?.map((e) => e.agencyName)?.[0],
      agencyPhone: branches?.map((e) => e.agencyPhone)?.[0],
      agencyEmail: branches?.map((e) => e.agencyEmail)?.[0],
      highlights: branches?.map((e) => e.highlights)?.[0],
      branchCount: branches?.length,
      branchIds: branches?.map((e) => e.branchId) || [],
      branches: branches,
    };
  });

  return {
    agencyCount: agenciesFlat.length,
    agencyIds:
      (groupedByAgency &&
        Object.keys(groupedByAgency).filter(
          (agencyId) => typeof agencyId !== "undefined"
        )) ||
      [],
    branchCount: sum(agenciesFlat.map((agency) => agency.branchCount)),
    branchIds: agenciesFlat?.flatMap((agency) => agency.branchIds),
    agencies: parseAgencyList(agenciesFlat),
  };
}

export const options = {
  redis: {
    prefix: "agencyList",
    ttl: 60 * 15,
  },
};
