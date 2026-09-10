/**
 * @file This file handles patron requests related to accounts.
 */

import { filterAgenciesByProps } from "../../utils/accounts";

export const typeDef = `
    extend type Patron {
        """
        Retrieves the list of accounts for the patron, including pagination and sorting options.
        """
        accounts: [PatronAccount]!
    }

    type PatronAccount {
        """
        Name of the patron.
        """
        name: String

        """
        The email address of the patron.
        """
        email: String

        """
        The municipality number of the patron.
        """
        municipalityNumber: String

        """
        The agency ID of the patron.
        """
        municipalityAgencyId: String

        """
        The address of the patron.
        """
        address: String

        """
        The postal code of the patron.
        """
        postalCode: String

        """
        The country of the patron.
        """
        country: String

        """
        Indicates whether the patron is blocked or not.
        """
        blocked: Boolean!
    }
`;

export async function loadAccountUser(parent, context) {
  if (!parent?.userId || !parent?.agencyId) {
    return null;
  }

  return await context.datasources.getLoader("user").load({
    userId: parent.userId,
    agencyId: parent.agencyId,
  });
}

export const resolvers = {
  Patron: {
    accounts(parent, args, context) {
      const user = context?.user;

      if (!user) {
        return [];
      }

      // Select CPR accounts from user agencies
      const accounts = filterAgenciesByProps(user?.agencies, {
        type: "CPR",
        useLocalFallbackForUnrepresentedAgencies: true,
        limitToOneAccountPerAgency: true,
      });

      return accounts.map((account) => ({
        agencyId: account.agencyId,
        userId: account.userId,
        municipalityNumber: user?.municipality,
        municipalityAgencyId: user?.municipalityAgencyId,
        blocked: user?.blocked ?? false,
      }));
    },
  },

  PatronAccount: {
    async name(parent, args, context) {
      return (await loadAccountUser(parent, context))?.name;
    },
    async email(parent, args, context) {
      return (await loadAccountUser(parent, context))?.mail;
    },
    municipalityNumber(parent) {
      return parent?.municipalityNumber;
    },
    municipalityAgencyId(parent) {
      return parent?.municipalityAgencyId;
    },
    async address(parent, args, context) {
      return (await loadAccountUser(parent, context))?.address;
    },
    async postalCode(parent, args, context) {
      return (await loadAccountUser(parent, context))?.postalCode;
    },
    async country(parent, args, context) {
      return (await loadAccountUser(parent, context))?.country;
    },
    blocked(parent) {
      return parent?.blocked ?? false;
    },
  },
};
