export const typeDef = `
"""
Traffic-light status for an agency or branch. ON_SHELF means at least one unrestricted copy is on the shelf, ON_SHELF_RESTRICTED means copies are present but every one of them carries a loan restriction, NOT_ON_SHELF means all copies are on loan or on order, UNKNOWN means no usable availability information.
"""
enum PublicLibraryHoldingsStatusEnum {
  """
  At least one unrestricted copy is on the shelf.
  """
  ON_SHELF

  """
  Copies are present but every one of them carries a loan restriction.
  """
  ON_SHELF_RESTRICTED

  """
  All copies are on loan or on order.
  """
  NOT_ON_SHELF

  """
  No usable availability information.
  """
  UNKNOWN @fallback
}

"""
ON_SHELF_RESTRICTED only: the most significant danMARC2 096*r loan-restriction code among the present copies, given by enum name, not by letter.
"""
enum PublicLibraryLoanRestrictionEnum {
  NOT_FOR_LOAN
  NO_AUTOMATIC_ILL
  COPY_INSTEAD_OF_LOAN
  SUPERVISED_READING_ROOM_ONLY
  BEING_ACQUIRED
  ON_SITE_USE_ONLY
  OWN_USERS_ONLY
  UNKNOWN @fallback
}

"""
A single branch's holdings of the unit. branchId and status are always present, and so is copyCount, except for a periodical; onShelfCount belongs to ON_SHELF and ON_SHELF_RESTRICTED, restriction to ON_SHELF_RESTRICTED. A branch carries no expectedAvailable: Rega reports dispatch dates per record and agency, not per branch.
"""
type PublicLibraryBranchHoldings {
  branchId: String!

  branch: PatronBranch

  """
  Copies the branch holds, whatever their availability and loan restriction. Left out when the unit is a periodical (PublicLibraryAgencyHoldings.isPeriodical).
  """
  copyCount: Int

  """
  Traffic-light status for the branch.
  """
  status: PublicLibraryHoldingsStatusEnum!

  """
  The present copies the status rests on. For ON_SHELF the unrestricted copies on the shelf, for ON_SHELF_RESTRICTED the copies carrying restriction. Left out for the other statuses. Also left out, whatever the status, when the unit is a periodical (PublicLibraryAgencyHoldings.isPeriodical).
  """
  onShelfCount: Int

  """
  ON_SHELF_RESTRICTED only: the most significant danMARC2 096*r loan-restriction code among the present copies, given by enum name, not by letter.
  """
  restriction: PublicLibraryLoanRestrictionEnum
}

"""
An agency's holdings of the unit, from a local-loan perspective. agencyId, status and branches are always present, and so is copyCount, except for a periodical. The remaining properties belong to a status and are left out otherwise. onShelfBranchCount belongs to ON_SHELF and ON_SHELF_RESTRICTED, restriction to ON_SHELF_RESTRICTED, expectedAvailable to NOT_ON_SHELF. The copies behind a status are counted per branch, by PublicLibraryBranchHoldings.onShelfCount.
"""
type PublicLibraryAgencyHoldings {
  agencyId: String!

  agency: PatronAgency

  """
  Copies the agency holds, whatever their availability and loan restriction. Left out for a periodical (isPeriodical).
  """
  copyCount: Int

  """
  Traffic-light status for the agency.
  """
  status: PublicLibraryHoldingsStatusEnum!

  """
  ON_SHELF and ON_SHELF_RESTRICTED: branches with the unit on the shelf, whether or not their copies carry a loan restriction. Left out when the unit is not on the shelf or when branch data is unavailable.
  """
  onShelfBranchCount: Int

  """
  ON_SHELF_RESTRICTED only: the most significant danMARC2 096*r loan-restriction code among the present copies, given by enum name, not by letter.
  """
  restriction: PublicLibraryLoanRestrictionEnum

  """
  NOT_ON_SHELF only: earliest dispatch date reported by Rega. Left out when unknown.
  """
  expectedAvailable: String

  """
  The agency's holdings note, whatever the status. Distinct notes of the agency's holdings are joined with "; ". Left out when empty.
  """
  note: String

  """
  The agency's branches holding the unit.
  """
  branches: [PublicLibraryBranchHoldings!]!

  """
  Present, and true, when the agency's local system didn't answer in time, and the answer would have used its data: the agency is served from the pre-computed data instead, or lacks the expectedAvailable it would have shown. Left out when the agency is complete.
  """
  incomplete: Boolean

  """
  Present, and true, when the unit is a periodical. Holdings of a periodical describe the periodical as a whole, not its volumes or issues, so the copy counts are left out; the status is still given. Left out when the unit is not a periodical, or when that is unknown.
  """
  isPeriodical: Boolean
}

"""
The requested ids belonging to one unit, summarised per agency.
"""
type PublicLibrarySummaryGroup {
  """
  The requested ids that resolved to this unit, sorted.
  """
  ids: [String!]!

  """
  Per agency, what is available for loan at the agency's branches.
  """
  agencies: [PublicLibraryAgencyHoldings!]!
}

"""
Patron-facing holdings status, grouped by corepo unit.
"""
type PublicLibrarySummaryResponse {
  """
  One group per corepo unit covered by the requested ids.
  """
  groups: [PublicLibrarySummaryGroup!]!

  """
  Present, and true, when some agency is incomplete. Left out when the response is complete. Ask again with complete=true for the missing data.
  """
  incomplete: Boolean
}

type Holdings {
  """
  Patron-facing holdings status for the requested id(s).

  For each requested pid/unit-id, group the ids by corepo unit and return, per agency and per branch, the holdings status patrons see. Ids that resolve to no unit are silently skipped. They produce no group rather than an error. If mergePids is set the units are merged into one group before it is summarised: the sorted union of their ids, and the localizations of all the units, each localization counted once, in the request order of the agency.
  """
  publicLibraries(
    """
    Agency to order localizations for (using vipcore:request-order).
    """
    agencyId: String!

    """
    Manifestation id (pid) or unit id.
    """
    id: [String!]!

    """
    If the response should be merged into one group, rather than grouped per unit.
    """
    mergePids: Boolean = false

    """
    Wait longer (default 30s instead of 3s) for live holdings from the local systems. Agencies that don't answer in time are marked incomplete. If a response is incomplete, call again with complete=true and replace the whole affected groups, as their agencies may change.
    """
    complete: Boolean = false
  ): PublicLibrarySummaryResponse!
}

extend type Query {
  holdings: Holdings!
}
`;

export const resolvers = {
  Query: {
    async holdings() {
      return {};
    },
  },
  PublicLibrarySummaryResponse: {
    async incomplete(parent) {
      return !!parent?.incomplete;
    },
  },
  Holdings: {
    async publicLibraries(parent, args, context) {
      return context.datasources.getLoader("publicLibraries").load({
        agencyId: args.agencyId,
        id: args.id,
        mergePids: args.mergePids,
        complete: args.complete,
      });
    },
  },
  PublicLibraryAgencyHoldings: {
    async agency(parent, args, context) {
      return context.datasources.getLoader("library").load({
        agencyid: parent.agencyId,
        limit: 50,
      });
    },
  },
  PublicLibraryBranchHoldings: {
    async branch(parent, args, context) {
      const branch = await context.datasources.getLoader("library").load({
        branchId: parent.branchId,
        limit: 1,
      });
      return branch?.result?.[0];
    },
  },
};
