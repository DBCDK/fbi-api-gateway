/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

import { isValidCpr } from "../utils/cpr";
import { isFFUAgency } from "../utils/agency";
import { getAccount, getAccounts } from "../utils/culr";

export const typeDef = `

enum GetAccountsType {
  LOCAL
  GLOBAL
}

enum CulrStatus {
    OK
    ERROR
    ERROR_INVALID_CPR
    ERROR_CPR_MISMATCH
    ERROR_INVALID_AGENCY
    ERROR_INVALID_PROVIDED_TOKEN
    ERROR_UNAUTHENTICATED_TOKEN
    ERROR_NO_AUTHORISATION
    ERROR_USER_ALREADY_CREATED
    ERROR_LOCALID_NOT_UNIQUE
    ERROR_ACCOUNT_DOES_NOT_EXIST
    ERROR_AGENCYID_NOT_PERMITTED
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

input CreateAccountTokens {

  """
  FFU accessToken containing credentials for the account which the user will be associated with 
  """
  ffu: String!

  """
  Authenticated accessToken containing CPR credentials for the users main/public account. Only needed for Auth Bearer header CPR match.
  """
  folk: String
}

input CreateAccountInput {

  """
  Tokens containing the credentials to create/associate a new user account
  """
  tokens: CreateAccountTokens!
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
    getAccounts(input: GetAccountsInput, 
      
      """
      Force a specific dataloader
      """
      type: GetAccountsType): CulrAccountResponse
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
      const accessToken = context.accessToken;
      const ffuToken = args.input?.tokens?.ffu;
      const folkToken = args.input?.tokens?.folk;

      // settings
      const ENABLE_CPR_CHECK = true;
      const ENABLE_CPR_MATCH_CHECK = true;
      const ENABLE_FFU_CHECK = true;
      const ENABLE_CREATED_CHECK = true;

      // token is not authenticated - anonymous token used
      // Note that we check on 'id' and not the culr 'uniqueId' - as the user may not exist in culr
      if (!context?.smaug?.user?.id) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
        };
      }

      const user = {};

      // Get user from provided ffuToken (only smaug config contains the loggedInAgencyId)
      user.ffu = (
        await context.datasources.getLoader("smaug").load({
          accessToken: ffuToken,
        })
      ).user;

      if (!user.ffu) {
        return {
          status: "ERROR_INVALID_PROVIDED_TOKEN",
        };
      }

      // Validate FFU Agency from FFU user credentials
      if (ENABLE_FFU_CHECK && !isFFUAgency(user.ffu?.agency)) {
        return {
          status: "ERROR_INVALID_AGENCY",
        };
      }

      // Get account from bearer token / autorization header
      user.bearer = await getAccount(accessToken, context, {
        type: "CPR",
      });

      // Ensure that userId from the fetched account is a valid CPR
      if (ENABLE_CPR_CHECK && !isValidCpr(user.bearer?.userIdValue)) {
        return {
          status: "ERROR_INVALID_CPR",
        };
      }

      // If CPR match is enabled and the optional folkToken is provided
      if (folkToken && ENABLE_CPR_MATCH_CHECK) {
        // Get account from provided folkToken
        user.folk = await getAccount(folkToken, context, {
          type: "CPR",
        });

        // Ensure that userId from the fetched account is a valid CPR
        if (ENABLE_CPR_CHECK && !isValidCpr(user.folk?.userIdValue)) {
          return {
            status: "ERROR_INVALID_CPR",
          };
        }

        if (user.folk?.userIdValue !== user.bearer?.userIdValue) {
          return {
            status: "ERROR_CPR_MISMATCH",
          };
        }
      }

      // CPR from Bearer token selected account
      const cpr = user.bearer?.userIdValue;

      // FFU credentials
      const localId = user.ffu?.id;
      const agencyId = user.ffu?.agency;

      // Ensure account is not already attached to user
      const accounts = await getAccounts(accessToken, context, {
        id: localId,
        agency: agencyId,
      });

      // Check if user is already subscribed to agency
      if (ENABLE_CREATED_CHECK && accounts.length > 0) {
        return {
          status: "ERROR_USER_ALREADY_CREATED",
        };
      }

      // If account not already exist - Create user account for agency

      // Check for dryRun
      if (args.dryRun) {
        return {
          status: "OK",
        };
      }

      // Create the account
      const response = await context.datasources
        .getLoader("culrCreateAccount")
        .load({ agencyId, cpr, localId });

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

      return { status: "ERROR" };
    },

    async deleteAccount(parent, args, context, info) {
      const agencyId = args.input?.agencyId;

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

      // Get token user accounts
      const account = await getAccount(context.accessToken, context, {
        agency: agencyId,
        type: "LOCAL",
      });

      if (!account) {
        return {
          status: "ERROR_ACCOUNT_DOES_NOT_EXIST",
        };
      }

      // Check for dryRun
      if (args.dryRun) {
        return {
          status: "OK",
        };
      }

      const response = await context.datasources
        .getLoader("culrDeleteAccount")
        .load({ agencyId, localId: account.userIdValue });

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
      const type = args.type;

      // Specific dataloader type
      const isLocal = type === "LOCAL";
      const isGlobal = type === "GLOBAL";

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
      let dataloader = isValidCpr(user.id)
        ? "culrGetAccountsByGlobalId"
        : "culrGetAccountsByLocalId";

      // force specific dataloader if type is set
      if (isLocal) {
        dataloader = "culrGetAccountsByLocalId";
      }

      if (isGlobal) {
        dataloader = "culrGetAccountsByGlobalId";
      }

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
