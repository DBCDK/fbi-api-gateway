export const typeDef = `
"""
What the agency can offer another library, derived from the ILL counts. READY_FOR_LOAN means ILL-lendable copies are on the shelf and can be dispatched now (illAvailable > 0), AVAILABLE means the agency lends the unit via ILL, but none of the lendable copies are on the shelf (illTotal > 0 and illAvailable == 0), NOT_FOR_LOAN means the agency has no copies it may lend via ILL (illTotal == 0).
"""
enum IllStatusEnum {
  """
  ILL-lendable copies are on the shelf and can be dispatched now (illAvailable > 0).
  """
  READY_FOR_LOAN

  """
  The agency lends the unit via ILL, but none of the lendable copies are on the shelf (illTotal > 0 and illAvailable == 0).
  """
  AVAILABLE

  """
  The agency has no copies it may lend via ILL (illTotal == 0).
  """
  NOT_FOR_LOAN
}

"""
An agency's copy counts for the unit, from an inter-library-loan perspective, alongside the agency they belong to. The counts are left out for a periodical (isPeriodical).
"""
type IllAgencyHoldings {
  agencyId: String!

  agency: PatronAgency

  """
  Copies the agency holds, total. Left out for a periodical.
  """
  copyCount: Int

  """
  Copies the agency may lend via ILL. Left out for a periodical.
  """
  illTotal: Int

  """
  ILL-lendable copies currently on the shelf. Left out for a periodical.
  """
  illAvailable: Int

  """
  What the agency can offer another library, derived from the ILL counts.
  """
  status: IllStatusEnum!

  """
  Earliest dispatch date reported by Rega, when the agency has ILL-lendable copies but none of them on the shelf (illTotal > 0 and illAvailable == 0). Null otherwise.
  """
  expectedAvailable: String

  """
  The agency's holdings note. Distinct notes of the agency's holdings are joined with "; ". Left out when empty.
  """
  note: String

  """
  The contents of the agency's set (MARC 300*n), e.g. "1 læsekredssæt á 10 bøger": the value of the agency's påhængspost, or else of the fællespost. Only when the fællespost is a set (008*m = 3); left out otherwise, and when the contents are unknown.
  """
  setNote: String

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
type IllSummaryGroup {
  """
  The requested ids that resolved to this unit, sorted.
  """
  ids: [String!]!

  """
  Per agency, what may be lent to other libraries (inter-library loan).
  """
  agencies: [IllAgencyHoldings!]!
}

"""
Inter-library-loan availability, grouped by corepo unit.
"""
type IllSummaryResponse {
  """
  One group per corepo unit covered by the requested ids.
  """
  groups: [IllSummaryGroup!]!

  """
  Present, and true, when some agency is incomplete. Left out when the response is complete. Ask again with complete=true for the missing data.
  """
  incomplete: Boolean
}

extend type Holdings {
  """
  Inter-library-loan summary for the requested id(s).

  For each requested pid/unit-id, group the ids by corepo unit and return, per agency, how many copies of the unit exist and how many of them may be lent to other libraries. Ids that resolve to no unit are silently skipped. They produce no group rather than an error. If mergePids is set the units are merged into one group before it is summarised: the sorted union of their ids, and the localizations of all the units, each localization counted once, in the request order of the agency.
  """
  ill(
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
  ): IllSummaryResponse!
}
`;

export const resolvers = {
  IllSummaryResponse: {
    async incomplete(parent) {
      return !!parent?.incomplete;
    },
  },
  Holdings: {
    async ill(parent, args, context) {
      return context.datasources.getLoader("ill").load({
        agencyId: args.agencyId,
        id: args.id,
        mergePids: args.mergePids,
        complete: args.complete,
      });
    },
  },
  IllAgencyHoldings: {
    async agency(parent, args, context) {
      return context.datasources.getLoader("library").load({
        agencyid: parent.agencyId,
        limit: 50,
      });
    },
  },
};
