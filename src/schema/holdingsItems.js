/**
 * @file Type definitions and resolvers for marc
 */

import { checkUserRights, itemStatusEnumMap } from "../utils/holdings";

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
    bibliographicRecordId: String!

    """
    The payload containing all issues/items for the bibliographic record.
    """
    input: CompleteWithIssuesInput!

    """
    If dryRun is true, the actual service will never get called.
    """
    dryRun: Boolean

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
    bibliographicRecordId: String!

    """
    Identifier for a material, usually a barcode.
    """
    itemId: String!

    """
    The payload containing details for the single item and related issue.
    """
    input: ItemWithIssueInput!

    """
    If dryRun is true, the actual service will never get called.
    """
    dryRun: Boolean

  ): HoldingsItemsStatus!

  """
  Removes all issues/items for a bibliographic record.
  This operation will also remove the 'firstAccessionDate' for any items not resurrected.
  """
  removeAllHoldingsItems(
    """
    The agency ID identifying the library.
    """
    agencyId: String
    """

    The bibliographic record ID (faust number).
    """
    bibliographicRecordId: String!

    """
    If dryRun is true, the actual service will never get called.
    """
    dryRun: Boolean

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
  Identifier for a material, usually a barcode.
  """
  issueId: String!

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
  Identifier for a material, usually a barcode.
  """
  itemId: String!

  """
  Human-readable text describing the branch.
  """
  branch: String!

  """
  Identifying number of the branch.
  """
  branchId: Int!

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
  ownerAgencyId: Int
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
  Human-readable text describing the branch.
  """
  branch: String!

  """
  Identifying number of the branch.
  """
  branchId: Int!

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
  ownerAgencyId: Int

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
  Status code, represented as an ENUM value
  """
  status: HoldingsItemsStatusEnum!

  """
  Human-readable message about the reason for the status.
  """
  message: String!

  """
  Optional tracking ID for debugging or log tracking.
  """
  trackingId: String
}

"""
Represents the status of an operation related to holdings items.
"""
enum HoldingsItemsStatusEnum {
  """
  The operation completed successfully.
  """
  OK

  """
  A generic error occurred during the operation.
  """
  ERROR

  """
  The operation failed due to an unauthenticated or invalid token.
  """
  ERROR_UNAUTHENTICATED_TOKEN

  """
  The operation failed because the token specified agency is invalid.
  """
  ERROR_INVALID_AGENCY

  """
  The operation failed due to lack of authorisation.
  """
  ERROR_NO_AUTHORISATION
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
      const { input, bibliographicRecordId, dryRun = false } = args;

      // set request uuid as trackingId
      const trackingId = context?.datasources?.stats?.uuid;

      // check if user attached to token has access rights
      const status = checkUserRights(context?.user);
      if (!status.ok) {
        return { ...status, trackingId };
      }

      // Map from enum values and restructure issues and items
      const data = {
        ...input,
        issues: (() => {
          const issuesMap = {};

          input.issues?.forEach((issue) => {
            const itemsMap = {};

            issue.items?.forEach((item) => {
              itemsMap[item.itemId] = {
                ...item,
                // Map status using the provided enum map
                status: itemStatusEnumMap[item?.status],
                // Map loanRestriction to lowercase (api enum), fallback to allowed empty string
                loanRestriction: item?.loanRestriction?.toLowerCase() || "",
              };
            });
            issuesMap[issue.issueId] = {
              ...issue,
              items: itemsMap,
            };
          });
          return issuesMap;
        })(),
      };

      // set agencyId, if token is anonymous, loggedInAgencyId will be null
      const agencyId =
        context.user?.loggedInAgencyId || context.profile?.agency;

      if (dryRun) {
        return {
          ok: true,
          status: "OK",
          message: "ok",
          trackingId,
        };
      }

      return await context.datasources
        .getLoader("updateHoldingsItems")
        .load({ data, agencyId, bibliographicRecordId, trackingId });
    },

    async updateSingleHoldingsItem(parent, args, context, info) {
      const { input, bibliographicRecordId, itemId, dryRun = false } = args;

      // set request uuid as trackingId
      const trackingId = context?.datasources?.stats?.uuid;

      // check if user attached to token has access rights
      const status = checkUserRights(context.user);
      if (!status.ok) {
        return { ...status, trackingId };
      }

      // map from api enum values to underlaying service enum values
      const data = {
        ...input,
        status: itemStatusEnumMap[input?.status],
        loanRestriction: input?.loanRestriction?.toLowerCase() || "",
      };

      // set agencyId, if token is anonymous, loggedInAgencyId will be null
      const agencyId =
        context.user?.loggedInAgencyId || context.profile?.agency;

      if (dryRun) {
        return {
          ok: true,
          status: "OK",
          message: "ok",
          trackingId,
        };
      }

      return await context.datasources
        .getLoader("updateHoldingsItems")
        .load({ data, agencyId, bibliographicRecordId, itemId, trackingId });
    },

    async removeAllHoldingsItems(parent, args, context, info) {
      const { bibliographicRecordId, dryRun = false } = args;

      // set request uuid as trackingId
      const trackingId = context?.datasources?.stats?.uuid;

      // check if user attached to token has access rights
      const status = checkUserRights(context.user);
      if (!status.ok) {
        return { ...status, trackingId };
      }

      // set agencyId, if token is anonymous, loggedInAgencyId will be null
      const agencyId =
        context.user?.loggedInAgencyId || context.profile?.agency;

      if (dryRun) {
        return {
          ok: true,
          status: "OK",
          message: "ok",
          trackingId,
        };
      }

      return await context.datasources
        .getLoader("removeHoldingsItems")
        .load({ agencyId, bibliographicRecordId, trackingId });
    },
  },
};
