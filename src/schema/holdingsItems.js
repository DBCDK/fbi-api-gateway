/**
 * @file Type definitions and resolvers for marc
 */

export const typeDef = `

extend type Mutation {
  holdingsItems: HoldingsItems!
}

type HoldingsItems {
  """
  Updates all holdings for a given bibliographic record.
  Non-referenced issues/items are removed, and items may be moved between records.
  """
  updateAllHoldingsItems(
    """
    Library number identifying the agency.
    """
    agencyId: String
    """
    Bibliographic record ID (faust number).
    """
    recordId: String!
    """
    Optional tracking ID for debugging or log tracking.
    """
    trackingId: String
    """
    The payload containing all issues/items for the bibliographic record.
    """
    input: CompleteWithIssuesInput!
  ): HoldingsItemsStatus!

  """
  Updates a single holding for a bibliographic record.
  If the record does not exist, a bad request is returned.
  """
  updateSingleHoldingsItem(
    """
    Library number identifying the agency.
    """
    agencyId: String
    """
    Bibliographic record ID (faust number).
    """
    recordId: String!
    """
    Identifier for a material, usually a barcode.
    """
    itemId: String!
    """
    Optional tracking ID for debugging or log tracking.
    """
    trackingId: String
    """
    The payload containing details for the single item and related issue.
    """
    input: ItemWithIssueInput!
  ): HoldingsItemsStatus!
}

"""
The payload for updating all issues/items for a bibliographic record.
"""
input CompleteWithIssuesInput {
  """
  When this structure was exported in ISO-8601 format with timezone Z.
  """
  version: String!
  """
  When the first item for this material was acquired, in ISO-8601 format.
  """
  firstAccessionDate: String
  """
  Notes about the bibliographic item.
  """
  note: String
  """
  Issues associated with the bibliographic record.
  """
  issues: [IssueWithItemsInput]
  """
  Whether online access for this bibliographic item is available.
  """
  online: Boolean
}

"""
Details of an issue, including its items.
"""
input IssueWithItemsInput {
  """
  Items associated with this issue.
  """
  items: [ItemInput!]
  """
  The text describing the issue.
  """
  issueText: String!
  """
  When an item is expected to be available for loan, in ISO-8601 format.
  """
  expectedDelivery: String
  """
  Number of items ready to be lent out. If 0, expectedDelivery must be set.
  """
  readyForLoan: Int
}

"""
Details of an individual item.
"""
input ItemInput {
  """
  Human-readable text describing the branch.
  """
  branch: String!
  """
  Identifying number of the branch.
  """
  branchId: String!
  """
  Human-readable text describing the department within the branch.
  """
  department: String!
  """
  Human-readable text describing the location within the department.
  """
  location: String!
  """
  Human-readable text describing the sub-location within the location.
  """
  subLocation: String!
  """
  Human-readable text describing the rules for lending.
  """
  circulationRule: String!
  """
  When the item was acquired, in ISO-8601 format.
  """
  accessionDate: String!
  """
  Rule for lending according to DanMarc 096r.
  """
  loanRestriction: LoanRestrictionEnum
  """
  The status of the item (e.g., OnShelf, OnLoan, etc.).
  """
  status: ItemStatusEnum
  """
  When this item was last lent, in ISO-8601 format.
  """
  lastLoanDate: String
  """
  Identifying the agencyId that owns this, if temporarily part of the library (ILL loan).
  """
  ownerAgencyId: String
}

"""
Represents the status of an item.
"""
enum ItemStatusEnum {
  """
  The item has been discarded and is no longer available.
  """
  DISCARDED
  """
  The item is marked as lost.
  """
  LOST
  """
  The item is not available for loan.
  """
  NOTFORLOAN
  """
  The item is currently on loan.
  """
  ONLOAN
  """
  The item is on order but not yet available.
  """
  ONORDER
  """
  The item is available on the shelf.
  """
  ONSHELF
}

enum LoanRestrictionEnum {
  A
  B
  C
  D
  E
  F
  G
}

"""
Payload for updating an item, including related issue details.
"""
input ItemWithIssueInput {
  """
  When this structure was exported in ISO-8601 format with timezone Z.
  """
  version: String!
  """
  Details of the issue, including its ID.
  """
  issue: IssueInputWithIdInput!
}

"""
Details of an issue, including its ID.
"""
input IssueInputWithIdInput {
  """
  The ID of the issue.
  """
  issueId: String!
  """
  The text describing the issue.
  """
  issueText: String!
  """
  When an item is expected to be available for loan, in ISO-8601 format.
  """
  expectedDelivery: String
  """
  Number of items ready to be lent out. If 0, expectedDelivery must be set.
  """
  readyForLoan: Int
}

"""
Represents the status of an operation.
"""
type HoldingsItemsStatus {
  """
  Indicates if the operation was successful.
  """
  ok: Boolean!
  """
  Human-readable message about the reason for the status.
  """
  message: String!
  """
  Optional tracking ID for debugging or log tracking.
  """
  trackingId: String
}
`;

export const resolvers = {
  Mutation: {
    async holdingsItems(parent, args, context, info) {
      return {};
    },
  },

  HoldingsItems: {
    async updateAllHoldingsItems(parent, args, context, info) {
      return {
        ok: true,
        message: "ost!",
      };
    },

    async updateSingleHoldingsItem(parent, args, context, info) {
      return {};
    },
  },
};
