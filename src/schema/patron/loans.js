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
        status: PatronLoansStatusEnum!

        """
        The list of loans for the patron.
        """
        items(orderBy: OrderLoansByEnum offset: Int limit: PaginationLimitScalar): [PatronLoanItem!]!
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
        snapshot: PatronLoanSnapshot
    }

    type PatronLoanSnapshot {
        """
        Stored faust number from the legacy loan service.
        """
        faust: String

        """
        Stored title from the legacy loan service.
        """
        title: String

        """
        Stored creator from the legacy loan service.
        """
        creator: String

        """
        Stored material type from the legacy loan service.
        """
        materialType: String

        """
        Stored edition from the legacy loan service.
        """
        edition: String

        """
        Stored page information from the legacy loan service.
        """
        pages: String

        """
        Stored publisher from the legacy loan service.
        """
        publisher: String

        """
        Stored language from the legacy loan service.
        """
        language: String
    }

    enum PatronLoansStatusEnum {
        OK
        FAILED
        ERROR_UNAUTHENTICATED_TOKEN
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
      const { orderBy = "DUEDATE_ASC", offset = 0, limit = 10 } = args;

      const sortedItems = [...(parent?.result || [])].sort((a, b) => {
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
      if (
        !parent?.titleId &&
        !parent?.title &&
        !parent?.creator &&
        !parent?.materialType &&
        !parent?.edition &&
        !parent?.pages &&
        !parent?.publisher &&
        !parent?.language
      ) {
        return null;
      }

      return {
        faust: parent?.titleId || null,
        title: parent?.title || null,
        creator: parent?.creator || null,
        materialType: parent?.materialType || null,
        edition: parent?.edition || null,
        pages: parent?.pages || null,
        publisher: parent?.publisher || null,
        language: parent?.language || null,
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
