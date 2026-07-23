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
        Retrieves the list of accounts for the patron, including pagination and sorting options.
        """
        accounts: [PatronAccount]!
    }

    type PatronAccount {
        
        """
        The total number of accounts for the patron.
        """
        numberOfAccounts: Int!

        """
        The overall status of the account lookup.
        """
        status: PatronAccountsOverallStatusEnum!

        """
        The email address of the patron.
        """
        email: String!

        """
        Name of the patron.
        """
        name: String!
        
        """
        The list of agencies associated with the patron.
        """
        agencies: [Branch]
    }

    enum PatronAccountsOverallStatusEnum {
        OK
        FAILED
        ERROR_UNAUTHENTICATED_TOKEN
    }
`;

export const resolvers = {
  Patron: {
    async accounts(parent, args, context, info) {
      const user = context?.user;

      if (!user) {
        return {
          numberOfAccounts: 0,
          status: "ERROR_UNAUTHENTICATED_TOKEN",
          email: "",
        };
      }

      try {
        const userInfoAccounts = filterDuplicateAgencies(user?.agencies);
        const res = await context.datasources.getLoader("loans").load({
          userInfoAccounts,
          accessToken: context.accessToken, // Required for testing
        });

        return {
          numberOfAccounts: res?.result?.length || 0,
          status: "OK",
          email: user?.email || "",
        };
      } catch (error) {
        log.error(
          `Failed to get loans from legacy loan service. Message: ${error.message}`
        );
        return {
          result: [],
          status: "FAILED",
          email: user?.email || "",
        };
      }
    },
  },
};
