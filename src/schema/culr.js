/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

import { isValidCpr } from "../utils/cpr";
import { isFFUAgency } from "../utils/agency";

export const typeDef = `

enum CulrStatus {
    OK
    ERROR
    ERROR_INVALID_CPR
    ERROR_INVALID_AGENCY
    ERROR_UNAUTHENTICATED_TOKEN
    ERROR_NO_AUTHORISATION
    ERROR_USER_ALREADY_CREATED
    ERROR_LOCALID_NOT_UNIQUE
    ERROR_ACCOUNT_DOES_NOT_EXIST
    ERROR_AGENCYID_NOT_PERMITTED
    ERROR_INVALID_PROVIDED_TOKEN
}

type CulrResponse {
    status: CulrStatus!
}

type CulrAccount {
  agencyId: String!
  userIdType: String!
  userIdValue: String!
}

type CulrAccountResponse {
  accounts: [CulrAccount!]!
  municipalityNo: String
  guid: String
}

input DeleteAccountInput {

    """
    The agencyId
    """
    agencyId: String!
}

input CreateAccountInput {

  """
  Authenticated accessToken containing credentials for the new created account in culr
  """
  accessToken: String!
}

input GetAccountsInput {

  """
  Authenticated accessToken containing globalId, If none provided auth token is used
  """
  accessToken: String!
}


type CulrService {

    """
    Add an agency to a CPR validated user
    """
    createAccount(input: CreateAccountInput!, 

    """
    If dryRun is set to true, the actual service is never called
    Used for testing
    """
    dryRun: Boolean): CulrResponse!

    """
    Remove an agency from a user
    """
    deleteAccount(input: DeleteAccountInput!, 

    """
    If dryRun is set to true, the actual service is never called
    Used for testing
    """
    dryRun: Boolean): CulrResponse!

    """
    Get all user accounts within the given agency by a localId
    """
    getAccountsByLocalId(input: GetAccountsInput): CulrAccountResponse

    """
    Get all user accounts within the given agency by a global id
    """
    getAccountsByGlobalId(input: GetAccountsInput): CulrAccountResponse

    """
    Get all user accounts within the given agency by a global id
    """
    getAccounts(input: GetAccountsInput): CulrAccountResponse
}

extend type Mutation {
    culr: CulrService!
}
 `;

export const resolvers = {
  Mutation: {
    async culr(parent, args, context, info) {
      return {};
    },
  },

  CulrService: {
    async createAccount(parent, args, context, info) {
      const accessToken = args.input?.accessToken;

      // settings
      const ENABLE_CPR_CHECK = true;
      const ENABLE_FFU_CHECK = true;
      const ENABLE_CREATED_CHECK = true;

      // token is not authenticated - anonymous token used
      // Note that we check on 'id' and not the culr 'uniqueId' - as the user may not exist in culr
      if (!context?.smaug?.user?.id) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
        };
      }

      // Fetch user from provided accessToken
      let user = context.smaug?.user;
      if (accessToken) {
        user = (
          await context.datasources.getLoader("smaug").load({
            accessToken,
          })
        ).user;
      }

      if (!user) {
        return {
          status: "ERROR_INVALID_PROVIDED_TOKEN",
        };
      }

      // Credentials from Bearer token
      const cpr = context?.smaug?.user?.id;

      // Credentials from provided token
      const { agency, id } = user;

      // validate cpr input
      if (ENABLE_CPR_CHECK && !isValidCpr(cpr)) {
        return {
          status: "ERROR_INVALID_CPR",
        };
      }

      // validate Agency
      if (ENABLE_FFU_CHECK && !isFFUAgency(agency)) {
        return {
          status: "ERROR_INVALID_AGENCY",
        };
      }

      // Retrieve user culr account
      const account = await context.datasources
        .getLoader("culrGetAccountsByGlobalId")
        .load({
          userId: cpr,
        });

      // User credentials (netpunkt-triple) could not be authorized
      if (account.code === "NO_AUTHORISATION") {
        return {
          status: "ERROR_NO_AUTHORISATION",
        };
      }

      // Check if user is already subscribed to agency
      if (ENABLE_CREATED_CHECK && account.code === "OK200") {
        if (
          account.accounts.find(
            (a) => a.userIdValue === id && a.agencyId === agency
          )
        )
          return {
            status: "ERROR_USER_ALREADY_CREATED",
          };
      }

      // If not already exist - Create user account for agency
      if (account.code === "ACCOUNT_DOES_NOT_EXIST") {
        // Check for dryRun
        if (args.dryRun) {
          return {
            status: "OK",
          };
        }

        // Create the account
        const response = await context.datasources
          .getLoader("culrCreateAccount")
          .load({ agencyId: agency, cpr, localId: id });

        // Response errors - localid is already in use for this user
        if (response.code === "TRANSACTION_ERROR") {
          return {
            status: "ERROR_LOCALID_NOT_UNIQUE",
          };
        }

        // AgencyID
        if (response.code === "ILLEGAL_ARGUMENT") {
          return {
            status: "ERROR_AGENCYID_NOT_PERMITTED",
          };
        }

        if (response.code === "OK200") {
          return {
            status: "OK",
          };
        }
      }

      return { status: "ERROR" };
    },

    async deleteAccount(parent, args, context, info) {
      const { agencyId, localId } = args.input;

      // settings
      const ENABLE_FFU_CHECK = true;

      // token is not authenticated - anonymous token used
      // Note that we check on 'id' and not the culr 'uniqueId' - as the user may not exist in culr
      if (!context?.smaug?.user?.id) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
        };
      }

      // validate Agency
      if (ENABLE_FFU_CHECK && !isFFUAgency(agencyId)) {
        return {
          status: "ERROR_INVALID_AGENCY",
        };
      }

      // Check for dryRun
      if (args.dryRun) {
        return {
          status: "OK",
        };
      }

      // Get agencies informations from login.bib.dk /userinfo endpoint
      const response = await context.datasources
        .getLoader("culrDeleteAccount")
        .load({ agencyId, localId });

      // Response errors - account does not exist
      if (response.code === "ACCOUNT_DOES_NOT_EXIST") {
        return {
          status: "ERROR_ACCOUNT_DOES_NOT_EXIST",
        };
      }

      // AgencyID
      if (response.code === "ILLEGAL_ARGUMENT") {
        return {
          status: "ERROR_AGENCYID_NOT_PERMITTED",
        };
      }

      if (response.code === "OK200") {
        return {
          status: "OK",
        };
      }

      return { status: "ERROR" };
    },

    async getAccountsByLocalId(parent, args, context, info) {
      const accessToken = args.input?.accessToken;

      let user = context.smaug?.user;
      if (accessToken) {
        user = (
          await context.datasources.getLoader("smaug").load({
            accessToken,
          })
        ).user;
      }

      if (!user) {
        return null;
      }

      // Retrieve user culr account
      const response = await context.datasources
        .getLoader("culrGetAccountsByLocalId")
        .load({
          userId: user.id,
          agencyId: user.agency,
        });

      if (!response.guid) {
        return null;
      }

      return response;
    },

    async getAccountsByGlobalId(parent, args, context, info) {
      const accessToken = args.input?.accessToken;

      let user = context.smaug?.user;
      if (accessToken) {
        user = (
          await context.datasources.getLoader("smaug").load({
            accessToken,
          })
        ).user;
      }

      if (!user) {
        return null;
      }

      // Retrieve user culr account
      const response = await context.datasources
        .getLoader("culrGetAccountsByGlobalId")
        .load({
          userId: user.id,
        });

      if (!response.guid) {
        return null;
      }

      return response;
    },

    async getAccounts(parent, args, context, info) {
      const accessToken = args.input?.accessToken;

      let user = context.smaug?.user;
      if (accessToken) {
        user = (
          await context.datasources.getLoader("smaug").load({
            accessToken,
          })
        ).user;
      }

      if (!user) {
        return null;
      }

      // select dataloader
      const dataloader = isValidCpr(user.id)
        ? "culrGetAccountsByGlobalId"
        : "culrGetAccountsByLocalId";

      // Retrieve user culr account
      const response = await context.datasources.getLoader(dataloader).load({
        userId: user.id,
        agencyId: user.agency,
      });

      if (!response.guid) {
        return null;
      }

      return response;
    },
  },
};
