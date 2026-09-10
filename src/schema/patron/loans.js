/**
 * @file This file handles current and historical loans for a patron.
 */

import { log } from "dbc-node-logger";
import {
  filterDuplicateAgencies,
  resolveManifestation,
} from "../../utils/utils";
import {
  getOverallStatus,
  isFaustNumber,
  isHistoricalLoanMaterialId,
  badUserInput,
} from "./utils";
import { buildPatronMaterialSnapshot } from "./snapshot";

const historicalLoanIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const serviceStatusMap = {
  ok: "OK",
  already_exists: "ALREADY_EXISTS",
  not_found: "NOT_FOUND",
  unknown_error: "UNKNOWN_ERROR",
};

const historicalLoanConsentMinimumAge = 15;

function validBirthDate(day, month, year) {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
}

function birthDateFromUserInfo(user) {
  const birthDate = String(user?.birthDate || "");
  const birthYear = String(user?.birthYear || "");

  if (/^\d{4}$/.test(birthDate) && /^\d{4}$/.test(birthYear)) {
    const parsed = validBirthDate(
      Number(birthDate.slice(0, 2)),
      Number(birthDate.slice(2, 4)),
      Number(birthYear)
    );
    if (parsed) {
      return parsed;
    }
  }

  return birthDateFromCpr(user?.cpr);
}

function getCprBirthYear(year, centuryCode) {
  if (centuryCode <= 3) {
    return 1900 + year;
  }
  if (centuryCode === 4 || centuryCode === 9) {
    return (year <= 36 ? 2000 : 1900) + year;
  }
  return (year <= 57 ? 2000 : 1800) + year;
}

function birthDateFromCpr(cpr) {
  const normalizedCpr = String(cpr || "").replace(/[^\d]/g, "");
  if (!/^\d{10}$/.test(normalizedCpr)) {
    return null;
  }

  const year = Number(normalizedCpr.slice(4, 6));
  return validBirthDate(
    Number(normalizedCpr.slice(0, 2)),
    Number(normalizedCpr.slice(2, 4)),
    getCprBirthYear(year, Number(normalizedCpr[6]))
  );
}

function getCurrentDateInCopenhagen() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
    .formatToParts(new Date())
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});

  return {
    day: Number(parts.day),
    month: Number(parts.month),
    year: Number(parts.year),
  };
}

function getHistoricalLoanConsentEligibility(user) {
  const birthDate = birthDateFromUserInfo(user);
  if (!birthDate) {
    return { canBeChanged: false, status: "AGE_NOT_VERIFIABLE" };
  }

  const today = getCurrentDateInCopenhagen();
  let age = today.year - birthDate.year;
  if (
    today.month < birthDate.month ||
    (today.month === birthDate.month && today.day < birthDate.day)
  ) {
    age -= 1;
  }

  return age >= historicalLoanConsentMinimumAge
    ? { canBeChanged: true, status: null }
    : { canBeChanged: false, status: "UNDER_AGE" };
}

function historicalLoanConsentResponse(consent, eligibility) {
  if (typeof consent !== "boolean") {
    return {
      isGranted: null,
      ...eligibility,
      status: eligibility.status || "FAILED",
    };
  }

  return {
    isGranted: consent,
    ...eligibility,
    status: eligibility.status || (consent ? "GRANTED" : "NOT_GRANTED"),
  };
}

function unauthenticatedHistoricalLoanConsent() {
  return {
    isGranted: null,
    canBeChanged: false,
    status: "ERROR_UNAUTHENTICATED_TOKEN",
  };
}

function mapServiceStatus(status) {
  return serviceStatusMap[status] || "UNKNOWN_ERROR";
}

function mapServiceErrorStatus(error) {
  switch (error?.serviceErrorCode) {
    case "MISSING_ACCESS_TOKEN":
    case "INVALID_ACCESS_TOKEN":
    case "MISSING_USER_ID":
      return "ERROR_UNAUTHENTICATED_TOKEN";
    case "HISTORICAL_LOAN_MANUAL_ADDS_DISABLED":
    case "LOAN_MANUAL_ADDS_DISABLED":
      return "ERROR_MANUAL_ADDS_DISABLED";
    case "HISTORICAL_LOAN_CONSENT_REQUIRED":
    case "LOAN_CONSENT_REQUIRED":
      return "CONSENT_REQUIRED";
    default:
      return "FAILED";
  }
}

async function loadMutation(loader, request) {
  try {
    return await loader.load(request);
  } finally {
    loader.clear?.(request);
  }
}

function mapCurrentLoansStatus(loansResponse) {
  if (!loansResponse) {
    return "FAILED";
  }

  if (loansResponse.status === true || loansResponse.statusCode === "OK") {
    return "OK";
  }

  return "FAILED";
}

function getTodayDateInCopenhagen() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentLoanStatus(loan) {
  const dueDate = loan?.dueDate?.slice?.(0, 10);

  if (!dueDate) {
    return "ACTIVE";
  }

  return dueDate < getTodayDateInCopenhagen() ? "OVERDUE" : "ACTIVE";
}

function getCurrentLoansPage(loans, { orderBy, status, offset, limit }) {
  const filteredItems = loans.filter(
    (item) => !status || getCurrentLoanStatus(item) === status
  );
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (orderBy) {
      case "DUEDATE_ASC":
        return new Date(a.dueDate) - new Date(b.dueDate);
      case "DUEDATE_DESC":
        return new Date(b.dueDate) - new Date(a.dueDate);
      case "TITLE_ASC":
        return (a.title || "").localeCompare(b.title || "", "da");
      case "TITLE_DESC":
        return (b.title || "").localeCompare(a.title || "", "da");
      default:
        return new Date(a.dueDate) - new Date(b.dueDate);
    }
  });

  return {
    hitcount: filteredItems.length,
    items: sortedItems.slice(offset, offset + limit),
  };
}

function normalizeDate(value) {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value || null;
}

function normalizeHistoricalLoanInput(loan) {
  return {
    agencyId: loan.agencyId || null,
    loanedAt: normalizeDate(loan.loanedAt),
    returnedAt: normalizeDate(loan.returnedAt),
    materialId: loan.materialId,
    materialIdType: isFaustNumber(loan.materialId) ? "FAUST" : "PID",
  };
}

function hasInvalidDateRange(loan) {
  return (
    loan.loanedAt !== null &&
    loan.returnedAt !== null &&
    loan.loanedAt > loan.returnedAt
  );
}

function resolveHistoricalLoanManifestation(loan, context) {
  const materialId = loan?.materialId || loan?.sourceMaterialId;
  const materialIdType = loan?.materialIdType || loan?.sourceMaterialIdType;

  if (materialIdType === "FAUST") {
    return resolveManifestation({ faust: materialId }, context);
  }

  if (materialIdType === "PID") {
    return resolveManifestation({ pid: materialId }, context);
  }

  return null;
}

function toServiceHistoricalLoan(loan, manifestation) {
  return {
    agencyId: loan.agencyId,
    loanedAt: loan.loanedAt,
    returnedAt: loan.returnedAt,
    materialId: loan.materialId,
    materialIdType: loan.materialIdType,
    snapshot: buildPatronMaterialSnapshot(manifestation),
  };
}

function accountForAgency(parent, context) {
  const user = context?.user;

  if (!user || !parent?.agencyId) {
    return null;
  }

  const account = filterDuplicateAgencies(user?.agencies).find(
    ({ agencyId }) => agencyId === parent.agencyId
  );

  if (!account) {
    return null;
  }

  return {
    agencyId: account.agencyId,
    userId: account.userId,
    municipalityNumber: user?.municipality,
    municipalityAgencyId: user?.municipalityAgencyId,
    blocked: user?.blocked ?? false,
  };
}

async function agencyForLoan(parent, context) {
  if (!parent?.agencyId) {
    return null;
  }

  const agency = await context.datasources.getLoader("library").load({
    agencyid: parent.agencyId,
    limit: 50,
  });

  return agency?.hitcount ? agency : null;
}

export const typeDef = `
    extend type Patron {
        """
        Retrieves current loans live from OpenUserStatus.
        """
        currentLoans(
          orderBy: OrderLoansByEnum
          status: PatronLoanStatusEnum
          offset: Int
          limit: PaginationLimitScalar
        ): PatronCurrentLoans!

        """
        Retrieves historical loans stored in UserData.
        """
        historicalLoans(
          offset: Int
          limit: PaginationLimitScalar
        ): PatronHistoricalLoans!

        """
        Retrieves consent for storing historical loans and whether the patron is old enough to change it.
        """
        historicalLoanConsent: PatronHistoricalLoanConsent!
    }

    extend type PatronMutation {
        """
        Adds one or more manual historical loans for integration testing.
        Snapshot data is resolved by the gateway and cannot be supplied by the client.
        """
        addHistoricalLoans(
          loans: [PatronHistoricalLoanInput!]!
          dryRun: Boolean
        ): AddHistoricalLoansResponse!

        """
        Deletes one or more historical loans by their public UserData IDs.
        """
        deleteHistoricalLoans(
          ids: [String!]!
          dryRun: Boolean
        ): DeleteHistoricalLoansResponse!

        """
        Changes consent for storing historical loans.
        """
        setHistoricalLoanConsent(
          consent: Boolean!
          dryRun: Boolean
        ): SetHistoricalLoanConsentResponse!
    }

    type PatronCurrentLoans {
        """
        The total number of current loans before filtering and pagination.
        """
        hitcount: Int!

        """
        The overall status of the current-loan lookup.
        """
        status: PatronLoansOverallStatusEnum!

        """
        Current loans for the requested page.
        """
        items: [CurrentLoan!]!
    }

    type CurrentLoan {
        """
        Identifier assigned to the loan by the library system.
        """
        id: String!

        """
        Due date reported by OpenUserStatus.
        """
        dueDate: DateTimeScalar!

        """
        Status computed from the due date in the Europe/Copenhagen timezone.
        """
        status: PatronLoanStatusEnum!

        """
        Account information for the patron who owns the loan.
        """
        account: PatronAccount

        """
        Branch information for the agency where the loan belongs.
        """
        agency: PatronAgency

        """
        The manifestation associated with the loan, when it can be resolved.
        """
        manifestation: Manifestation

        """
        Fallback metadata reported by OpenUserStatus.
        """
        snapshot: PatronMaterialSnapshot
    }

    type PatronHistoricalLoans {
        """
        The total number of historical loans before pagination.
        """
        hitcount: Int!

        """
        The overall status of the historical-loan lookup.
        """
        status: PatronLoansOverallStatusEnum!

        """
        Historical loans in UserData service order.
        """
        items: [HistoricalLoan!]!
    }

    type HistoricalLoan {
        """
        Stable public UserData identifier used when deleting the historical loan.
        """
        id: String!

        """
        Date on which the material was borrowed, when known.
        """
        loanedAt: DateScalar

        """
        Date on which the material was returned, when known.
        """
        returnedAt: DateScalar

        """
        The patron's current account for the loan agency, when that account still exists.
        This is not a snapshot of the account at the time of the historical loan.
        """
        account: PatronAccount

        """
        Branch information for the agency where the loan belonged.
        """
        agency: PatronAgency

        """
        The manifestation associated with the historical loan, when it can still be resolved.
        """
        manifestation: Manifestation

        """
        Stored fallback metadata captured when the historical loan was ingested.
        """
        snapshot: PatronMaterialSnapshot
    }

    input PatronHistoricalLoanInput {
        """
        Agency ID for the library where the material was borrowed, when known.
        """
        agencyId: String

        """
        PID or numeric faust number. The identifier type is detected by the gateway.
        """
        materialId: String!

        """
        Borrowing date in YYYY-MM-DD format, when known.
        When both dates are supplied, this date cannot be after returnedAt.
        """
        loanedAt: DateScalar

        """
        Return date in YYYY-MM-DD format, when known.
        When both dates are supplied, this date cannot be before loanedAt.
        """
        returnedAt: DateScalar
    }

    type AddHistoricalLoansResponse {
        status: PatronLoansOverallStatusEnum!
        items: [PatronHistoricalLoanStatusItem!]!
    }

    type DeleteHistoricalLoansResponse {
        status: PatronLoansOverallStatusEnum!
        items: [PatronHistoricalLoanStatusItem!]!
    }

    type PatronHistoricalLoanConsent {
        """Whether the patron has given consent. Null when the status could not be retrieved."""
        isGranted: Boolean

        """Whether the patron's age can be verified as at least 15 years."""
        canBeChanged: Boolean!

        """The result of retrieving or changing consent, including age eligibility."""
        status: PatronHistoricalLoanConsentStatusEnum!
    }

    enum PatronHistoricalLoanConsentStatusEnum {
        GRANTED
        NOT_GRANTED
        UNDER_AGE
        AGE_NOT_VERIFIABLE
        ERROR_UNAUTHENTICATED_TOKEN
        FAILED
    }

    type SetHistoricalLoanConsentResponse {
        """Whether the consent update operation succeeded."""
        status: SetHistoricalLoanConsentStatusEnum!

        """The updated consent state. Null when the operation was not performed or failed."""
        historicalLoanConsent: PatronHistoricalLoanConsent
    }

    enum SetHistoricalLoanConsentStatusEnum {
        OK
        UNDER_AGE
        AGE_NOT_VERIFIABLE
        ERROR_UNAUTHENTICATED_TOKEN
        FAILED
    }

    type PatronHistoricalLoanStatusItem {
        status: PatronLoanMutationStatusEnum!
        id: String
        materialId: String
    }

    enum PatronLoansOverallStatusEnum {
        OK
        FAILED
        PARTIALLY_FAILED
        ERROR_UNAUTHENTICATED_TOKEN
        ERROR_MANUAL_ADDS_DISABLED
        CONSENT_REQUIRED
    }

    enum PatronLoanStatusEnum {
        ACTIVE
        OVERDUE
    }

    enum PatronLoanMutationStatusEnum {
        OK
        FAILED
        INVALID_ID
        INVALID_MATERIAL_ID
        INVALID_DATE_RANGE
        ALREADY_EXISTS
        NOT_FOUND
        UNKNOWN_ERROR
    }

    enum OrderLoansByEnum {
        DUEDATE_ASC
        DUEDATE_DESC
        TITLE_ASC
        TITLE_DESC
    }
`;

export const resolvers = {
  Patron: {
    async currentLoans(parent, args, context, info) {
      const user = context?.user;
      const { orderBy = "DUEDATE_ASC", status, offset = 0, limit = 10 } = args;

      if (!user) {
        return {
          hitcount: 0,
          items: [],
          status: "ERROR_UNAUTHENTICATED_TOKEN",
        };
      }

      if (offset < 0) {
        throw badUserInput("offset must be greater than or equal to 0");
      }

      try {
        const userInfoAccounts = filterDuplicateAgencies(user?.agencies);
        const response = await context.datasources.getLoader("loans").load({
          userInfoAccounts,
          accessToken: context.accessToken,
        });

        const page = getCurrentLoansPage(response?.result || [], {
          orderBy,
          status,
          offset,
          limit,
        });

        return {
          ...page,
          status: mapCurrentLoansStatus(response),
        };
      } catch (error) {
        log.error(
          `Failed to get loans from OpenUserStatus. Message: ${error.message}`
        );
        return { hitcount: 0, items: [], status: "FAILED" };
      }
    },

    async historicalLoans(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const accessToken = context?.accessToken;
      const { offset = 0, limit = 10 } = args;
      if (!uniqueId || !accessToken) {
        return {
          hitcount: 0,
          items: [],
          status: "ERROR_UNAUTHENTICATED_TOKEN",
        };
      }

      if (offset < 0) {
        throw badUserInput("offset must be greater than or equal to 0");
      }

      try {
        const response = await context.datasources
          .getLoader("userDataV2GetHistoricalLoans")
          .load({ accessToken, offset, limit });

        return {
          hitcount: response?.hitcount || 0,
          items: response?.items || [],
          status: response?.status || "OK",
        };
      } catch (error) {
        log.error(
          `Failed to get historical loans from UserData. Message: ${error.message}`
        );
        return {
          hitcount: 0,
          items: [],
          status: mapServiceErrorStatus(error),
        };
      }
    },

    async historicalLoanConsent(parent, args, context) {
      const accessToken = context?.accessToken;
      const user = context?.user;
      if (!accessToken || !user) {
        return unauthenticatedHistoricalLoanConsent();
      }

      const eligibility = getHistoricalLoanConsentEligibility(user);
      try {
        const response = await context.datasources
          .getLoader("userDataV2GetHistoricalLoanConsent")
          .load({ accessToken });

        return historicalLoanConsentResponse(response?.consent, eligibility);
      } catch (error) {
        log.error(
          `Failed to get historical loan consent from UserData. Message: ${error.message}`
        );
        return { isGranted: null, ...eligibility, status: "FAILED" };
      }
    },
  },

  PatronMutation: {
    async setHistoricalLoanConsent(parent, args, context) {
      const accessToken = context?.accessToken;
      const user = context?.user;
      if (!accessToken || !user) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
          historicalLoanConsent: null,
        };
      }

      const eligibility = getHistoricalLoanConsentEligibility(user);
      if (!eligibility.canBeChanged) {
        return {
          status: eligibility.status,
          historicalLoanConsent: null,
        };
      }

      const { consent, dryRun = false } = args;
      if (dryRun) {
        return {
          status: "OK",
          historicalLoanConsent: historicalLoanConsentResponse(
            consent,
            eligibility
          ),
        };
      }

      try {
        const loader = context.datasources.getLoader(
          "userDataV2SetHistoricalLoanConsent"
        );
        const request = { accessToken, consent };
        const response = await loadMutation(loader, request);

        return {
          status: "OK",
          historicalLoanConsent: historicalLoanConsentResponse(
            response?.consent ?? consent,
            eligibility
          ),
        };
      } catch (error) {
        log.error(
          `Failed to set historical loan consent in UserData. Message: ${error.message}`
        );
        return { status: "FAILED", historicalLoanConsent: null };
      }
    },

    async addHistoricalLoans(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const accessToken = context?.accessToken;
      const { dryRun = false, loans = [] } = args;

      if (!uniqueId || !accessToken) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
          items: loans.map(({ materialId }) => ({
            materialId,
            status: "FAILED",
          })),
        };
      }

      if (loans.length === 0) {
        throw badUserInput("loans must contain at least one item");
      }

      const normalizedLoans = loans.map(normalizeHistoricalLoanInput);

      try {
        const resolved = await Promise.all(
          normalizedLoans.map(async (loan) => {
            if (!isHistoricalLoanMaterialId(loan.materialId)) {
              return {
                loan,
                manifestation: null,
                invalidMaterialId: true,
              };
            }

            if (hasInvalidDateRange(loan)) {
              return {
                loan,
                manifestation: null,
                invalidMaterialId: false,
                invalidDateRange: true,
              };
            }

            return {
              loan,
              manifestation: await resolveHistoricalLoanManifestation(
                loan,
                context
              ),
              invalidMaterialId: false,
              invalidDateRange: false,
            };
          })
        );
        const items = resolved.map(
          ({ loan, manifestation, invalidMaterialId, invalidDateRange }) => ({
            materialId: loan.materialId,
            status: invalidMaterialId
              ? "INVALID_MATERIAL_ID"
              : invalidDateRange
                ? "INVALID_DATE_RANGE"
                : manifestation
                  ? "OK"
                  : "NOT_FOUND",
          })
        );
        const data = resolved
          .filter(({ manifestation }) => manifestation)
          .map(({ loan, manifestation }) =>
            toServiceHistoricalLoan(loan, manifestation)
          );

        if (dryRun || data.length === 0) {
          return { status: getOverallStatus(items), items };
        }

        const loader = context.datasources.getLoader(
          "userDataV2AddHistoricalLoans"
        );
        const request = { accessToken, loans: data };
        const response = await loadMutation(loader, request);
        let serviceResultIndex = 0;
        const itemsWithService = items.map((item) => {
          if (item.status !== "OK") {
            return item;
          }

          const result = response?.results?.[serviceResultIndex++];
          return {
            id: result?.id ?? null,
            materialId: result?.materialId ?? item.materialId,
            status: mapServiceStatus(result?.status),
          };
        });

        return {
          status: getOverallStatus(itemsWithService, ["OK", "ALREADY_EXISTS"]),
          items: itemsWithService,
        };
      } catch (error) {
        log.error(
          `Failed to add historical loans to UserData. Message: ${error.message}`
        );
        return {
          status: mapServiceErrorStatus(error),
          items: loans.map(({ materialId }) => ({
            materialId,
            status: error?.status === 400 ? "FAILED" : "UNKNOWN_ERROR",
          })),
        };
      }
    },

    async deleteHistoricalLoans(parent, args, context, info) {
      const uniqueId = context?.user?.uniqueId;
      const accessToken = context?.accessToken;
      const { dryRun = false, ids = [] } = args;

      if (!uniqueId || !accessToken) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
          items: ids.map((id) => ({ id, status: "FAILED" })),
        };
      }

      if (ids.length === 0) {
        throw badUserInput("ids must contain at least one item");
      }

      const validIdSet = new Set(
        ids.filter((id) => historicalLoanIdPattern.test(id))
      );

      if (dryRun) {
        const items = ids.map((id) => ({
          id,
          status: validIdSet.has(id) ? "OK" : "INVALID_ID",
        }));
        return { status: getOverallStatus(items), items };
      }

      const validIds = ids.filter((id) => validIdSet.has(id));
      if (validIds.length === 0) {
        return {
          status: "FAILED",
          items: ids.map((id) => ({ id, status: "INVALID_ID" })),
        };
      }

      try {
        const loader = context.datasources.getLoader(
          "userDataV2DeleteHistoricalLoans"
        );
        const request = { accessToken, ids: validIds };
        const response = await loadMutation(loader, request);
        let resultIndex = 0;
        const items = ids.map((id) => {
          if (!validIdSet.has(id)) {
            return { id, status: "INVALID_ID" };
          }

          const result = response?.results?.[resultIndex++];
          return {
            id,
            materialId: result?.materialId || null,
            status: mapServiceStatus(result?.status),
          };
        });

        return { status: getOverallStatus(items), items };
      } catch (error) {
        log.error(
          `Failed to delete historical loans in UserData. Message: ${error.message}`
        );
        return {
          status: mapServiceErrorStatus(error),
          items: ids.map((id) => ({
            id,
            status: error?.status === 400 ? "FAILED" : "UNKNOWN_ERROR",
          })),
        };
      }
    },
  },

  PatronCurrentLoans: {
    hitcount(parent) {
      return parent?.hitcount || 0;
    },
    status(parent) {
      return parent?.status || "OK";
    },
    items(parent) {
      return parent?.items || [];
    },
  },

  CurrentLoan: {
    id(parent) {
      return parent?.loanId || null;
    },
    status(parent) {
      return getCurrentLoanStatus(parent);
    },
    account(parent, args, context) {
      return accountForAgency(parent, context);
    },
    agency(parent, args, context) {
      return agencyForLoan(parent, context);
    },
    snapshot(parent) {
      const hasSnapshotData =
        parent?.titleId ||
        parent?.title ||
        parent?.creator ||
        parent?.materialType;

      if (!hasSnapshotData) {
        return null;
      }

      return {
        _sourceFaust: parent?.titleId || null,
        title: parent?.title || null,
        creator: parent?.creator || null,
        materialType: parent?.materialType || null,
        workType: null,
      };
    },
    manifestation(parent, args, context, info) {
      if (!parent?.titleId) {
        return null;
      }

      return resolveManifestation({ faust: parent.titleId }, context);
    },
  },

  PatronHistoricalLoans: {
    hitcount(parent) {
      return parent?.hitcount || 0;
    },
    status(parent) {
      return parent?.status || "OK";
    },
    items(parent) {
      return parent?.items || [];
    },
  },

  HistoricalLoan: {
    account(parent, args, context) {
      return accountForAgency(parent, context);
    },
    agency(parent, args, context) {
      return agencyForLoan(parent, context);
    },
    snapshot(parent) {
      return parent?.snapshot || null;
    },
    manifestation(parent, args, context, info) {
      return resolveHistoricalLoanManifestation(parent, context);
    },
  },
};
