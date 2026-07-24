/**
 * @file This file handles patron requests related to agencies.
 */

export const typeDef = `

    extend type PatronAccount {
        """
        The library agency associated with the patron account.
        """
        agency: PatronAgency
    }

    type PatronAgency {
        """
        The unique identifier of the agency.
        """
        id: String!

        """
        The primary name of the agency.
        """
        name: String

        """
        Alternative names associated with the agency.
        """
        names: [String!]

        """
        The type of library agency.
        """
        type: String

        """
        The opening hours of the agency's main branch.
        """
        openingHours: String

        """
        The current status of the agency.
        """
        status: String

        """
        The city in which the agency's main branch is located.
        """
        city: String

        """
        The postal code of the agency's main branch.
        """
        postalCode: String

        """
        The postal address of the agency's main branch.
        """
        address: String

        """
        The phone number of the agency's main branch.
        """
        phone: String

        """
        The email address of the agency's main branch.
        """
        email: String

        """
        The website URL of the agency's main branch.
        """
        websiteUrl: String

        """
        The catalogue URL of the agency's main branch.
        """
        catalogueUrl: String

        """
        The lookup URL of the agency's main branch.
        """
        lookupUrl: String

        """
        Indicates whether the agency's main branch is temporarily closed.
        """
        temporarilyClosed: Boolean!

        """
        Indicates whether pickup is allowed at the agency's main branch.
        """
        pickupAllowed: Boolean!

        """
        The total number of branches belonging to the agency.
        """
        numberOfBranches: Int!

        """
        The branches belonging to the agency.
        """
        branches: [PatronBranch!]!
    }

    type PatronBranch {
        """
        The unique identifier of the branch.
        """
        id: String!

        """
        The name of the branch.
        """
        name: String

        """
        The type of library branch.
        """
        type: String

        """
        The opening hours of the branch.
        """
        openingHours: String

        """
        The current status of the branch.
        """
        status: String

        """
        The city in which the branch is located.
        """
        city: String

        """
        The postal code of the branch.
        """
        postalCode: String

        """
        The postal address of the branch.
        """
        address: String

        """
        The phone number of the branch.
        """
        phone: String

        """
        The email address of the branch.
        """
        email: String

        """
        The website URL of the branch.
        """
        websiteUrl: String

        """
        The catalogue URL of the branch.
        """
        catalogueUrl: String

        """
        The lookup URL of the branch.
        """
        lookupUrl: String

        """
        Indicates whether the branch is temporarily closed.
        """
        temporarilyClosed: Boolean!

        """
        Indicates whether pickup is allowed at the branch.
        """
        pickupAllowed: Boolean!

        """
        The agency to which the branch belongs.
        """
        agency: PatronAgency
    }

`;

const getAgencyBranch = (parent) =>
  parent?.result?.find((branch) => branch?.agencyId === branch?.branchId) ||
  parent?.result?.[0];

export const resolvers = {
  PatronAccount: {
    async agency(parent, args, context) {
      if (!parent?.agencyId) {
        return null;
      }

      const agency = await context.datasources.getLoader("library").load({
        agencyid: parent.agencyId,
        limit: 1000,
      });

      return agency?.hitcount ? agency : null;
    },
  },

  PatronAgency: {
    id(parent) {
      const agency = getAgencyBranch(parent);
      return agency?.agencyId;
    },
    name(parent) {
      const agency = getAgencyBranch(parent);
      return agency?.agencyName;
    },
    names(parent) {
      const agency = getAgencyBranch(parent);
      return agency?.agencyNames || [];
    },
    type(parent) {
      const agency = getAgencyBranch(parent);
      return agency?.agencyType;
    },
    openingHours(parent) {
      return getAgencyBranch(parent)?.openingHours;
    },
    status(parent) {
      return getAgencyBranch(parent)?.status;
    },
    city(parent) {
      return getAgencyBranch(parent)?.city;
    },
    postalCode(parent) {
      return getAgencyBranch(parent)?.postalCode;
    },
    address(parent) {
      return getAgencyBranch(parent)?.postalAddress;
    },
    phone(parent) {
      return getAgencyBranch(parent)?.branchPhone;
    },
    email(parent) {
      return getAgencyBranch(parent)?.branchEmail;
    },
    numberOfBranches(parent) {
      return parent?.hitcount || 0;
    },
    websiteUrl(parent) {
      const agency = getAgencyBranch(parent);
      return agency?.branchWebsiteUrl;
    },
    catalogueUrl(parent) {
      return getAgencyBranch(parent)?.branchCatalogueUrl;
    },
    lookupUrl(parent) {
      return getAgencyBranch(parent)?.lookupUrl;
    },
    temporarilyClosed(parent) {
      return getAgencyBranch(parent)?.temporarilyClosed ?? false;
    },
    pickupAllowed(parent) {
      return getAgencyBranch(parent)?.pickupAllowed ?? false;
    },
    branches(parent) {
      return (parent?.result || []).map((branch) => ({
        ...branch,
        patronAgency: parent,
      }));
    },
  },

  PatronBranch: {
    id(parent) {
      return parent?.branchId;
    },
    type(parent) {
      return parent?.branchType;
    },
    phone(parent) {
      return parent?.branchPhone;
    },
    email(parent) {
      return parent?.branchEmail;
    },
    websiteUrl(parent) {
      return parent?.branchWebsiteUrl;
    },
    catalogueUrl(parent) {
      return parent?.branchCatalogueUrl;
    },
    temporarilyClosed(parent) {
      return parent?.temporarilyClosed ?? false;
    },
    pickupAllowed(parent) {
      return parent?.pickupAllowed ?? false;
    },
    address(parent) {
      return parent?.postalAddress;
    },
    agency(parent) {
      return parent?.patronAgency || null;
    },
  },
};
