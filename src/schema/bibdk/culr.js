/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

import { isValidCpr } from "../../utils/cpr";
import { hasCulrDataSync } from "../../utils/agency";
import { getAccount, getAccounts } from "../../utils/accounts";

export const typeDef = `

enum GetAccountsTypeEnum {
  
  """
  Forces a getAccountsByLocalId request, a localId and agencyId is used as credentials
  """
  LOCAL

  """
  Forces a getAccountsByGlobalId request, a cpr number is used as credentials
  """
  GLOBAL
}

enum CreateAccountStatusEnum {
  """
  Account was successfully created
  """
  OK

  """
  Account was not created - Some unknown error occured
  """
  ERROR

  """
  A provided token does not have a valid CPR
  """
  ERROR_INVALID_CPR

  """
  Agency for provided token is not an FFU library
  """
  ERROR_INVALID_AGENCY

  """
  Token is not authenticated
  """
  ERROR_UNAUTHENTICATED_TOKEN

  """
  Credentials for the underlying service could not be authorized
  """
  ERROR_NO_AUTHORISATION

  """
  AgencyId input is out of permission scope
  """
  ERROR_AGENCYID_NOT_PERMITTED

  """
  Account already exist
  """
  ERROR_USER_ALREADY_CREATED

  """
  LocalId is already in use
  """
  ERROR_LOCALID_NOT_UNIQUE

  """
  There is a mismatch between the provided tokens CPR credentials
  """
  ERROR_CPR_MISMATCH

  """
  Some provided token has missing credentials
  """
  ERROR_INVALID_PROVIDED_TOKEN
}

enum DeleteAccountStatusEnum {
  """
  Account was successfully deleted
  """
  OK

  """
  Account was not deleted - Some unknown error occured
  """
  ERROR

  """
  A provided token does not have a valid CPR
  """
  ERROR_INVALID_CPR

  """
  Agency for provided token is not an FFU library
  """
  ERROR_INVALID_AGENCY

  """
  Token is not authenticated
  """
  ERROR_UNAUTHENTICATED_TOKEN

  """
  Credentials for the underlying service could not be authorized
  """
  ERROR_NO_AUTHORISATION

  """
  AgencyId input is out of permission scope
  """
  ERROR_AGENCYID_NOT_PERMITTED

  """
  The account which was requested for deleting does not exist
  """  
  ERROR_ACCOUNT_DOES_NOT_EXIST
}

type CreateAccountResponse {
    status: CreateAccountStatusEnum!
}

type DeleteAccountResponse {
  status: DeleteAccountStatusEnum!
}

type CulrAccount {
  agencyId: String!
  userIdType: String!
  userIdValue: String!
}

type BibdkCulrAccountResponse {
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

input CreateAccountTokensInput {

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
  tokens: CreateAccountTokensInput!
}

input GetAccountsInput {

  """
  Authenticated accessToken containing globalId, If none provided auth token is used
  """
  accessToken: String!
}

type BibdkCulrMutationFields {

    """
    Add an agency to a CPR validated user
    """
    createAccount(input: CreateAccountInput!, 

    """
    If dryRun is set to true, the actual service is never called
    Used for testing
    """
    dryRun: Boolean): CreateAccountResponse!

    """
    Remove an agency from a user
    """
    deleteAccount(input: DeleteAccountInput!, 

    """
    If dryRun is set to true, the actual service is never called
    Used for testing
    """
    dryRun: Boolean): DeleteAccountResponse!
}

type BibdkCulrQueryFields{
  """
  Get all user accounts within the given agency by a global id
  """
  getAccounts(input: GetAccountsInput, 
    
    """
    Force a specific dataloader
    """
    type: GetAccountsTypeEnum): BibdkCulrAccountResponse
}

`;

export const resolvers = {
  BibdkCulrQueryFields: {
    async getAccounts(parent, args, context, info) {
      const accessToken = args.input?.accessToken;
      const type = args.type;

      // Specific dataloader type
      const isLocal = type === "LOCAL";
      const isGlobal = type === "GLOBAL";

      // userInfo
      let user = context?.user;

      // update user for provided accessToken
      if (accessToken) {
        user = (
          await context.datasources.getLoader("userinfo").load({
            accessToken,
          })
        ).attributes;
      }

      if (!user?.userId) {
        return null;
      }

      // select dataloader
      let dataloader = isValidCpr(user.userId)
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
        userId: user.userId,
        agencyId: user.loggedInAgencyId,
      });

      if (!response?.guid) {
        return null;
      }

      return response;
    },
  },

  BibdkCulrMutationFields: {
    async createAccount(parent, args, context, info) {
      const accessToken = context.accessToken;
      const ffuToken = args.input?.tokens?.ffu;
      const folkToken = args.input?.tokens?.folk;

      const dryRun = args.dryRun;

      // settings
      const ENABLE_CPR_CHECK = true;
      const ENABLE_CPR_MATCH_CHECK = true;
      const ENABLE_FFU_CHECK = true;
      const ENABLE_CREATED_CHECK = true;

      // token is not authenticated - anonymous token used
      // Note that we check on 'id' and not the culr 'uniqueId' - as the user may not exist in culr
      if (!context?.user?.userId) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
        };
      }

      const user = {};

      // Get user from provided ffuToken
      user.ffu = (
        await context.datasources.getLoader("userinfo").load({
          accessToken: ffuToken,
        })
      )?.attributes;

      if (!user.ffu) {
        return {
          status: "ERROR_INVALID_PROVIDED_TOKEN",
        };
      }

      // Validate FFU Agency from FFU user credentials
      const loggedInAgencyId = user.ffu?.loggedInAgencyId;

      if (
        ENABLE_FFU_CHECK &&
        (await hasCulrDataSync(loggedInAgencyId, context))
      ) {
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
      const localId = user.ffu?.userId;
      const agencyId = user.ffu?.loggedInAgencyId;

      // Ensure account is not already attached to user
      const accounts = await getAccounts(accessToken, context, {
        id: localId,
        agency: agencyId,
      });

      // Check if user is already subscribed to agency
      if (ENABLE_CREATED_CHECK && accounts?.length > 0) {
        return {
          status: "ERROR_USER_ALREADY_CREATED",
        };
      }

      // If account not already exist - Create user account for agency

      // Check for dryRun
      if (dryRun) {
        return {
          status: "OK",
        };
      }

      // Ensure account is not connected to any other user, by removing it
      // Swap bearer accessToken for FFU accessToken
      const copyContext = { ...context, accessToken: ffuToken };

      // Remove existing account
      await deleteFFUAccount({ agencyId, dryRun, context: copyContext });

      // Create the account
      const response = await context.datasources
        .getLoader("culrCreateAccount")
        .load({ agencyId, cpr, localId });

      // Response errors - localid is already in use on this agency
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
        // clear user redis cache for userinfo
        await context.datasources
          .getLoader("userinfo")
          .clearRedis({ accessToken });

        return {
          status: "OK",
        };
      }

      return { status: "ERROR" };
    },

    async deleteAccount(parent, args, context, info) {
      const agencyId = args.input?.agencyId;
      const dryRun = args.dryRun;
      return deleteFFUAccount({ agencyId, dryRun, context });
    },
  },
};

/**
 *
 * will delete a users relation to a FFU library. Deletes the library account in Culr.
 * @returns
 */
export const deleteFFUAccount = async ({ agencyId, dryRun, context }) => {
  const accessToken = context.accessToken;

  try {
    // settings
    const ENABLE_FFU_CHECK = true;

    // token is not authenticated - anonymous token used
    // Note that we check on 'id' and not the culr 'uniqueId' - as the user may not exist in culr
    if (!context?.user?.userId) {
      return {
        status: "ERROR_UNAUTHENTICATED_TOKEN",
      };
    }

    // validate Agency
    if (ENABLE_FFU_CHECK && (await hasCulrDataSync(agencyId, context))) {
      return {
        status: "ERROR_INVALID_AGENCY",
      };
    }

    // Get token user accounts
    const account = await getAccount(accessToken, context, {
      agency: agencyId,
      type: "LOCAL",
    });

    if (!account) {
      return {
        status: "ERROR_ACCOUNT_DOES_NOT_EXIST",
      };
    }

    // Check for dryRun
    if (dryRun) {
      return {
        status: "OK",
      };
    }

    // Get agencies informations from login.bib.dk /userinfo endpoint
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
      // clear user redis cache for userinfo
      await context.datasources
        .getLoader("userinfo")
        .clearRedis({ accessToken });

      return {
        status: "OK",
      };
    }

    return { status: "ERROR" };
  } catch (error) {
    return { status: "ERROR" };
  }
};
