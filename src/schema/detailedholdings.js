import uniq from "lodash/uniq";
import { resolveLocalizations, resolveWork } from "../utils/utils";

/**
 * Localizations + HoldingsItem type definitions
 */
export const typeDef = `
enum HoldingsResponseStatusEnum {
  """
  The material is on the shelf at this branch
  """
  ON_SHELF

  """
  The material is on the shelf at this branch, but is not for loan (available for in-house use only)
  """
  ON_SHELF_NOT_FOR_LOAN

  """
  The material is not on the shelf at this branch
  """
  NOT_ON_SHELF

  """
  The material is not owned by the agency
  """
  NOT_OWNED

  """
  The material is not found
  """
  UNKNOWN_MATERIAL

  """
  No status is given by the branch, hence we don't know if the material
  is on the shelf
  """
  UNKNOWN_STATUS  @fallback
}

"""
Represents loan restrictions for an item
"""
enum HoldingsItemLoanRestrictionEnum {
  """
  Indicates that the material can only be loaned to the library's own users and is not available for interlibrary loan
  """
  G
}

type HoldingsItem {
  branchName: String
  status: ItemStatusEnum
  department: String
  location: String
  subLocation: String
  loanRestriction: HoldingsItemLoanRestrictionEnum
}


type HoldingsResponse {

  status: HoldingsResponseStatusEnum!

  """
  Expected return date for the material at agency level

  Is only set if no branches in agency have the material ON_SHELF
  """
  expectedAgencyReturnDate: String

  """
  Expected return date for the material at branch level
  """
  expectedBranchReturnDate: String

  """
  Items on the shelf at the branch (actual copies)
  """
  items: [HoldingsItem!]

  """
  A list of items that belong to branches that are not visible or accessible in the system.
  These branches, such as book storage facilities or off-site repositories, are not listed
  for end-users, but their items can still be requested or accessed.
  """
  unlistedBranchItems: [HoldingsItem!]

  """
  Url to local site, where holding details may be found
  """
  lookupUrl: String
  
  """
  Urls to local site - one for each identifier
  """
  lookupUrls: [String!]  

  """
  The number of items owned by the agency.
  Returns null if it is unknown
  """
  ownedByAgency: Int
}

extend type Branch {
  holdings(pids:[String]): HoldingsResponse @complexity(value: 5, multipliers: ["pids"])
}

type Lamp{
  color:String
  message: String
}
type DetailedHoldings {
  count: Int!
  branchId: String
  expectedDelivery: String
  agencyHoldings: [AgencyHolding]
  holdingItems: [Status]
  lamp: Lamp
}
type AgencyHolding{
  localisationPid: String
  localIdentifier: String
  agencyId: String
}
type Status{
  branch: String
  branchId: String
  willLend: String
  expectedDelivery: String
  localHoldingsId: String
  circulationRule: String
  department: String
  issueId: String
  issueText: String
  location: String
  note: String
  readyForLoan: String
  status: String
  subLocation: String
}`;

/**
 * Determines if a branch should be handled as an agency
 *
 */
function hasIndependentBranches(agencyId) {
  return ["800010"].includes(agencyId);
}
function getIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Given a list of pids, this will return all pids in corresponding units,
 * in a flattened list
 */
async function resolveUnits(pids, context) {
  let unitPids = {};
  await Promise.all(
    pids.map(async (pid) => {
      const work = await resolveWork({ pid }, context);
      const manifestation = work?.manifestations?.all?.find(
        (manifestation) => manifestation.pid === pid
      );
      const unitId = manifestation?.unitId;
      const unit = work?.manifestations?.all?.filter(
        (manifestation) => manifestation.unitId === unitId
      );
      unit?.forEach((manifestation) => {
        unitPids[manifestation.objectId] = true;
      });
    })
  );

  // Sort it so we get cache hits
  const sorted = Object.keys(unitPids);
  sorted.sort();
  return sorted;
}

/**
 * Find local identifers given agency and pids
 */
async function resolveLocalIdentifiers(pids, agencyId, context) {
  // Find localizations for the pids
  const localizations = await resolveLocalizations(
    {
      pids,
    },
    context
  );

  // Check if this agency has localization
  const agencyHoldings = localizations.agencies?.find(
    (agency) => agency?.agencyId === agencyId
  );

  const unique = {};
  // Find the local identifiers (we need those, for making lookups in local library system)
  agencyHoldings?.holdingItems?.forEach((item) => {
    unique[`${item.agencyId}-${item.localIdentifier}`] = {
      localIdentifier: item.localIdentifier,
      agencyId: item.agencyId,
      localizationPid: item.localizationPid,
    };
  });
  return Object.values(unique);
}

/**
 * We filter away some holdings, if
 * - branch is deleted
 * - branch is a service-punkt
 */
async function filterHoldings(holdings, context) {
  if (!holdings?.length) {
    return holdings;
  }
  const filterRes = { holdings: [], unlistedBranchItems: [] };

  await Promise.all(
    holdings.map(async (holding) => {
      const res = await context.datasources.getLoader("library").load({
        branchId: holding.branchId,
        limit: 1,
        status: "AKTIVE",
        bibdkExcludeBranches: false,
      });
      if (!res?.result?.length || holding?.branchType === "servicepunkt") {
        filterRes.unlistedBranchItems.push(holding);
      }

      filterRes.holdings.push(holding);
    })
  );
  return filterRes;
}

function getLookupUrl(branch, localIdentifiers) {
  if (branch?.lookupUrl?.includes("search/ting")) {
    const pids = localIdentifiers?.map((id) => id.localizationPid);
    return [`${branch?.lookupUrl}${encodeURIComponent(pids?.join(" OR "))}`];
  }
  const allIdentifiers =
    localIdentifiers?.map((id) => id?.localIdentifier) || [];

  // Check if we need to use a single identifier or multiple
  const selectedIdentifiers =
    branch?.lookupUrl?.includes("/record/") ||
    branch?.lookupUrl?.includes("/work/")
      ? allIdentifiers?.[0]
      : encodeURIComponent(uniq(allIdentifiers)?.join(" OR "));

  // Replace all _IDNR_ with identifers
  if (branch?.lookupUrl?.includes("_IDNR_")) {
    return allIdentifiers?.map((ident) =>
      branch.lookupUrl.replace(/_IDNR_/g, ident)
    );
  }

  // Well.. This is a fallback
  if (branch?.lookupUrl) {
    return [branch.lookupUrl + selectedIdentifiers];
  }
}

export const resolvers = {
  Branch: {
    async holdings(parent, args, context, info) {
      const branchIsIndependent = hasIndependentBranches(parent?.agencyId);
      // Expand pids, we include pids from units
      const uniquePids = await resolveUnits(args.pids, context);

      //@TODO .. if there are more than one pid we want the newest first :)
      // If no pids are found, we return
      if (!uniquePids?.length) {
        return { status: "UNKNOWN_MATERIAL" };
      }

      // Now, we check with vip-core if this branch supports detailedHoldings and holdingsItems
      const detailedHoldingsAddress = await context.datasources
        .getLoader("detailedHoldingsSupported")
        .load({
          branchId: branchIsIndependent ? parent?.branchId : parent?.agencyId,
        });

      const supportDetailedHoldings = !!detailedHoldingsAddress;

      // We then convert pids to local identifers for the entire agency
      const localIdentifiers = await resolveLocalIdentifiers(
        uniquePids,
        parent.agencyId,
        context
      );

      // When no local identifers are found, the agency does not own the material
      if (!localIdentifiers?.length) {
        return { status: "NOT_OWNED" };
      }

      const lookupUrls = getLookupUrl(parent, localIdentifiers);
      const lookupUrl = lookupUrls?.[0];

      // Date of today, for instance 2024-04-14
      const today = getIsoDate();

      // Fetch holdings items for entire agency
      let holdingsItemsForAgency = await context.datasources
        .getLoader("holdingsitemsForAgency")
        .load({
          agencyId: parent.agencyId,
          pids: localIdentifiers?.map(
            (localIdentifier) => localIdentifier.localizationPid
          ),
        });

      holdingsItemsForAgency = holdingsItemsForAgency
        ?.map((item) => ({
          ...item,
          expectedDelivery: item.status === "OnShelf" ? today : null,
          notOnSHelf: !(
            item.status === "OnShelf" || item.status === "NotForLoan"
          ),
          status: item?.status?.toUpperCase?.(),
          branchName: item?.branch,
        }))
        .filter?.(
          (item) => item.status !== "DISCARDED" && item.status !== "LOST"
        );

      const ownedByAgency = holdingsItemsForAgency?.length || null;

      const filteredHoldingsItems = await filterHoldings(
        holdingsItemsForAgency,
        context
      );
      holdingsItemsForAgency = filteredHoldingsItems.holdings;

      const holdingsItemsForBranch = holdingsItemsForAgency?.filter(
        (item) => item?.branchId === parent.branchId
      );

      // Fetch detailed holdings (this will make a call to a local agency system)
      let detailedHoldings = (
        await context.datasources.getLoader("detailedholdings").load({
          localIds: localIdentifiers,
        })
      )?.holdingstatus;

      const filteredDetailedholdings = await filterHoldings(
        detailedHoldings,
        context
      );
      detailedHoldings = filteredDetailedholdings.holdings;

      // Prefer holdings from holdings items
      let holdings =
        holdingsItemsForAgency?.length > 0
          ? holdingsItemsForAgency
          : detailedHoldings || [];

      // Check that holdings belong to branch that is active
      holdings = (
        await Promise.all(
          holdings.map(async (holding) => {
            const res = await context.datasources.getLoader("library").load({
              branchId: holding.branchId,
              limit: 1,
              status: "AKTIVE",
              bibdkExcludeBranches: false,
            });
            if (res?.result?.length > 0) {
              return holding;
            }
          })
        )
      )?.filter((holding) => !!holding);

      // Holdings that are on shelf at any branch in agency
      const onShelfInAgency = holdings?.filter(
        (holding) => holding?.expectedDelivery === today
      );

      // Holdings that are on shelf but not for loan at any branch in agency
      const onShelfNotForLoanInAgency = holdings?.filter(
        (holding) => !holding?.expectedDelivery && !holding?.notOnSHelf
      );

      // Holdings that are on loan, sorted by the earliest expected delivery first
      const expectedReturnDateInAgency = detailedHoldings?.filter?.(
        (holding) => holding?.expectedDelivery > today
      );

      expectedReturnDateInAgency?.sort((a, b) =>
        a.expectedDelivery.localeCompare(b.expectedDelivery)
      );

      const expectedReturnDateInBranch = expectedReturnDateInAgency?.filter(
        (holding) => holding?.branchId === parent.branchId
      );

      // Check if material is on shelf at current branch
      if (
        onShelfInAgency?.find(
          (holding) => holding?.branchId === parent.branchId
        )
      ) {
        return {
          status: "ON_SHELF",
          items: holdingsItemsForBranch,
          unlistedBranchItems: filteredHoldingsItems.unlistedBranchItems,
          lookupUrl,
          lookupUrls,
          ownedByAgency,
        };
      }

      // We set expectedAgencyReturnDate only if no branch in agency has the material on the shelf
      const expectedAgencyReturnDate = !onShelfInAgency?.length
        ? expectedReturnDateInAgency?.[0]?.expectedDelivery
        : null;

      let expectedBranchReturnDate =
        expectedReturnDateInBranch?.[0]?.expectedDelivery;

      const holdingsItemsForBranchOnLoan = holdingsItemsForBranch?.filter?.(
        (item) => item?.status === "ONLOAN"
      );

      // If the branch usually holds the material (but it's on loan)
      // and no return date is set, use the agency’s expected return date as fallback.
      if (
        !expectedBranchReturnDate &&
        holdingsItemsForBranchOnLoan?.length > 0
      ) {
        expectedBranchReturnDate = expectedAgencyReturnDate;
      }

      // Check if material is on shelf but not for loan at current branch
      if (
        onShelfNotForLoanInAgency?.find(
          (holding) => holding?.branchId === parent.branchId
        )
      ) {
        return {
          status:
            expectedBranchReturnDate || holdingsItemsForBranchOnLoan?.length > 0
              ? "NOT_ON_SHELF"
              : "ON_SHELF_NOT_FOR_LOAN",
          expectedAgencyReturnDate,
          expectedBranchReturnDate,
          items: holdingsItemsForBranch,
          unlistedBranchItems: filteredHoldingsItems.unlistedBranchItems,
          lookupUrl,
          lookupUrls,
          ownedByAgency,
        };
      }

      // For independent branches, the material may be NOT_ON_SHELF or NOT_OWNED
      // But for normal branches, the state can only be NOT_ON_SHELF at this point
      let status;
      if (!supportDetailedHoldings) {
        // When branch does not support holdings we return status UNKNOWN_STATUS
        status = "UNKNOWN_STATUS";
      } else if (expectedBranchReturnDate || !branchIsIndependent) {
        status = "NOT_ON_SHELF";
      } else {
        status = "NOT_OWNED";
      }

      return {
        status,
        expectedAgencyReturnDate,
        expectedBranchReturnDate,
        items: holdingsItemsForBranch,
        unlistedBranchItems: filteredHoldingsItems.unlistedBranchItems,
        lookupUrl,
        lookupUrls,
        ownedByAgency,
      };
    },
  },

  DetailedHoldings: {
    holdingItems(parent, args, context, info) {
      return parent.holdingstatus;
    },
    count(parent, args, context, info) {
      return parent?.holdingstatus?.length || 0;
    },
    lamp(parent, args, context, info) {
      let statusobject = { message: "no_loc_no_holding", color: "none" };
      //check if there are any localizations at all
      if (parent.holdingsitems === null && parent.holdingstatus?.length < 1) {
        // no localizations - we can do nothing
        return statusobject;
      }
      // branch has no holding - there are localizations in agency
      if (parent.holdingstatus?.length < 1) {
        return { message: "loc_no_holding", color: "yellow" };
      }
      // branch has holding - check status
      // if we find a 'green' lamp all is good
      // yellow is second best
      parent.holdingstatus.every((hold) => {
        if (hold.status === "OnShelf") {
          statusobject = { message: "loc_holding", color: "green" };
          // break every loop
          return false;
        }
        if (hold.status === "OnLoan") {
          statusobject = {
            message: "loc_no_hold_expect",
            color: "yellow",
          };
        }
        if (hold.status === "NotForLoan") {
          // we will rather return yellow than red
          if (statusobject.color !== "yellow") {
            statusobject = { message: "loc_hold_no_loan", color: "red" };
          }
        }
        // continue every loop
        return true;
      });

      return statusobject;
    },
  },
  AgencyHolding: {
    localisationPid(parent, args, context, info) {
      return parent.localisationPid;
    },
    localIdentifier(parent, args, context, info) {
      return parent.localIdentifier;
    },
    agencyId(parent, args, context, info) {
      return parent.agency;
    },
  },
  Status: {
    branch(parent, args, context, info) {
      return parent.branch;
    },
    branchId(parent, args, context, info) {
      return parent.branchId;
    },
    willLend(parent, args, context, info) {
      return parent.willLend;
    },
    expectedDelivery(parent, args, context, info) {
      return parent.expectedDelivery;
    },
    localHoldingsId(parent, args, context, info) {
      return parent.localHoldingsId;
    },
    circulationRule(parent, args, context, info) {
      return parent.circulationRule;
    },
    department(parent, args, context, info) {
      return parent.department;
    },
    issueId(parent, args, context, info) {
      return parent.issueId;
    },
    issueText(parent, args, context, info) {
      return parent.issueText;
    },
    location(parent, args, context, info) {
      return parent.location;
    },
    note(parent, args, context, info) {
      return parent.note;
    },
    readyForLoan(parent, args, context, info) {
      return parent.readyForLoan;
    },
    status(parent, args, context, info) {
      return parent["status"];
    },
    subLocation(parent, args, context, info) {
      return parent.subLocation;
    },
  },
  HoldingsItem: {
    loanRestriction(parent) {
      return parent?.loanRestriction?.toUpperCase?.() || null;
    },
  },
};
