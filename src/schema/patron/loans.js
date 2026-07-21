/**
 * @file This file handles "patron" requests related to loans.
 *
 */

import { log } from "dbc-node-logger";
import {
  filterDuplicateAgencies,
  resolveManifestation,
} from "../../utils/utils";

export const typeDef = `
    extend type Patron {
        """
        Retrieves the list of loans for the patron, including pagination and sorting options.
        """
        loans: PatronLoans!
    }

    type PatronLoans {
        """
        The total number of loans for the patron.
        """
        hitcount: Int!

        """
        The overall status of the loan lookup.
        """
        status: PatronLoansOverallStatusEnum!

        """
        The list of loans for the patron.
        """
        items(orderBy: OrderLoansByEnum status: PatronLoanStatusEnum offset: Int limit: PaginationLimitScalar): [PatronLoanItem!]!
    }

    type PatronLoanItem {
        """
        The unique identifier for the loan.
        """
        id: String!

        """
        Due date of the loan.
        """
        dueDate: DateTimeScalar!

        """
        Computed loan status based on due date.
        """
        status: PatronLoanStatusEnum!

        """
        Branch information for the agency where the loan belongs.
        """
        agency: Branch

        """
        The bibliographic record associated with the loan, if it can still be resolved from the faust number.
        """
        manifestation: Manifestation

        """
        Stored fallback metadata captured from the legacy loan service.
        """
        snapshot: PatronMaterialSnapshot
    }

    enum PatronLoansOverallStatusEnum {
        OK
        FAILED
        ERROR_UNAUTHENTICATED_TOKEN
    }

    enum PatronLoanStatusEnum {
        ACTIVE
        OVERDUE
    }

    enum OrderLoansByEnum {
        DUEDATE_ASC
        DUEDATE_DESC
        TITLE_ASC
        TITLE_DESC
    }
`;

function mapLegacyLoanStatus(loansResponse) {
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

function getLoanStatus(loan) {
  const dueDate = loan?.dueDate?.slice?.(0, 10);

  if (!dueDate) {
    return "ACTIVE";
  }

  return dueDate < getTodayDateInCopenhagen() ? "OVERDUE" : "ACTIVE";
}

export const resolvers = {
  Patron: {
    async loans(parent, args, context, info) {
      const user = context?.user;

      if (!user) {
        return {
          result: [],
          status: "ERROR_UNAUTHENTICATED_TOKEN",
        };
      }

      try {
        const userInfoAccounts = filterDuplicateAgencies(user?.agencies);
        const res = await context.datasources.getLoader("loans").load({
          userInfoAccounts,
          accessToken: context.accessToken, // Required for testing
        });

        return {
          result: res?.result || [],
          status: mapLegacyLoanStatus(res),
        };
      } catch (error) {
        log.error(
          `Failed to get loans from legacy loan service. Message: ${error.message}`
        );
        return {
          result: [],
          status: "FAILED",
        };
      }
    },
  },

  PatronLoans: {
    hitcount(parent) {
      return parent?.result?.length || 0;
    },
    status(parent) {
      return parent?.status || "OK";
    },
    items(parent, args, context, info) {
      const { orderBy = "DUEDATE_ASC", status, offset = 0, limit = 10 } = args;

      const filteredItems = (parent?.result || []).filter((item) => {
        if (!status) {
          return true;
        }

        return getLoanStatus(item) === status;
      });

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

      return sortedItems.slice(offset, offset + limit);
    },
  },

  PatronLoanItem: {
    id(parent) {
      return parent?.loanId || null;
    },
    status(parent) {
      return getLoanStatus(parent);
    },
    async agency(parent, args, context, info) {
      if (!parent?.agencyId) {
        return null;
      }

      const libraries = await context.datasources.getLoader("library").load({
        branchId: parent.agencyId.replace(/\D/g, ""),
      });

      return libraries?.result?.[0] || null;
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
};
