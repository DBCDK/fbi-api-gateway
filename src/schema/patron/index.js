/**
 * @file This file handles "patron" requests.
 *
 */

export const typeDef = `
    extend type Query {
      """
      Retrieves information about the patron, such as bookmarks, reservations, and loans.
      """
      patron: Patron @deprecated(reason: "@draft")
    }

    """
    Information about the patron associated with the current access token.
    """
    type Patron {
      """
      Name of the current patron.
      """
      name: String

      """
      Email address of the current patron.
      """
      email: String

      """
      Municipality number of the current patron.
      """
      municipalityNumber: String

      """
      Municipality agency ID of the current patron.
      """
      municipalityAgencyId: String

      """
      Address of the current patron.
      """
      address: String

      """
      Postal code of the current patron.
      """
      postalCode: String

      """
      Country of the current patron.
      """
      country: String

      """
      Agency ID where the current patron is logged in.
      """
      loggedInAgencyId: String

      """
      Branch ID where the current patron is logged in.
      """
      loggedInBranchId: String

      """
      Indicates whether the current patron is blocked.
      """
      blocked: Boolean!
    }

    extend type Mutation {
      """
      Updates patron information, such as adding or removing bookmarks.
      """
      patron: PatronMutation @deprecated(reason: "@draft")
    }

    type PatronMutation
 `;

export const resolvers = {
  Query: {
    async patron(parent, args, context) {
      return {};
    },
  },
  Mutation: {
    async patron(parent, args, context) {
      return {};
    },
  },
  Patron: {
    name(parent, args, context) {
      return context?.user?.name;
    },
    email(parent, args, context) {
      return context?.user?.email;
    },
    municipalityNumber(parent, args, context) {
      return context?.user?.municipality;
    },
    municipalityAgencyId(parent, args, context) {
      return context?.user?.municipalityAgencyId;
    },
    address(parent, args, context) {
      return context?.user?.address;
    },
    postalCode(parent, args, context) {
      return context?.user?.postalCode;
    },
    country(parent, args, context) {
      return context?.user?.country;
    },
    loggedInAgencyId(parent, args, context) {
      return context?.user?.loggedInAgencyId;
    },
    loggedInBranchId(parent, args, context) {
      return context?.user?.loggedInBranchId;
    },
    blocked(parent, args, context) {
      return context?.user?.blocked ?? false;
    },
  },
};
