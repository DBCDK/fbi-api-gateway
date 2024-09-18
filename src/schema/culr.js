/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

export const typeDef = `

enum CulrResponseCodesEnum {
  OK_200
  NO_AUTHORISATION
  ACCOUNT_ALREADY_EXISTS
  TRANSACTION_ERROR
  ILLEGAL_ARGUMENT
  UNKNOWN_ERROR
  ACCOUNT_DOES_NOT_EXIST
  PROGRAM_ERROR
  COULD_NOT_AUTHENTICATE
}

enum GlobalUidTypesEnum {
  CICEROUID
  SYSTEMUID
  CPR
}

enum UserIdTypesEnum {
  LOCAL
  UNILOGIN
  CPR
}

input GlobalUIDInput {
  """
  The specific globally unique type.
  """
  uidType: GlobalUidTypesEnum!
  """
  The value of the globally unique type.
  """
  uidValue: String!
}

input LocalUIDInput {
  """
  Library number in the form of a 6-digit number.
  """
  agencyId: String!
  """
  User's identification at the given library.
  """
  userIdValue: String!
}

input UserIdValueAndTypeInput {
  """
  User's type.
  """
  userIdType: UserIdTypesEnum!
  """
  The value of the user's type.
  """
  userIdValue: String!
}

type Account {
  """
  AgencyId of the provider that created the given account.
  """
  provider: String
  """
  The type of the given account.
  """
  userIdType: UserIdTypesEnum
  """
  The value of the type.
  """
  userIdValue: String
}

type CulrResponseStatus {
  """
  Status code of the response.
  """
  code: CulrResponseCodesEnum
  """
  If the response is not OK200, this field may contain an explanation of any errors.
  """
  message: String
}

type CulrResponse {
  """
  Indicates if the given GUID text string exists in CULR. Only set if responding to a call of hasculraccount.
  """
  hasCulrAccount: Boolean
  """
  Status of the executed call.
  """
  responseStatus: CulrResponseStatus!
}

type CulrAccountResponse {
  """
  List of the user's accounts.
  """
  accounts: [Account]!
  """
  Municipality number if set on the user's patron.
  """
  municipalityNo: String
  """
  GUID associated with the user's patron if it exists.
  """
  guid: String
  """
  Status of the executed call.
  """
  responseStatus: CulrResponseStatus!
}

type CulrQuery {
  """
  Method to retrieve all accounts under the user's patron based on either CPR, CICEROUID, or SYSTEMUID.
  """  
  getAccountsByGlobalId(
    """
    Globally unique user ID and type.
    """
    userCredentials: GlobalUIDInput!
  ) : CulrAccountResponse!

  """
  Method to retrieve all accounts under the user's patron based on localId.
  """
  getAccountsByLocalId(
    """
    The user's agencyId and localId.
    """
    userCredentials: LocalUIDInput!
  ) : CulrAccountResponse!

  """
  Method to validate whether a UUID GUID exists in CULR.
  """
  hasCulrAccount(
    """
    GUID text string to be checked.
    """
    guid: String!
  ): CulrResponse!

  """
  Method to retrieve an account from a provider, either using local ID or CPR number.
  """
  getAccountFromProvider(
    """
    The library where the given action is associated.
    """
    agencyId: String!
    """
    The user's type and value. For example, CPR and CPR number or LOCALID and LOCALID number.
    """
    userCredentials: UserIdValueAndTypeInput!
  ) : CulrAccountResponse!
}

type CulrMutate {

  """
  Method to create a new account that can either be of local or global type (CPR, CICEROUID, or SYSTEMUID).
  """
  createAccount(
    """
    The library where the given action is associated.
    """
    agencyId: String!
    """
    The user's type and value. For example, CPR and CPR number or LOCALID and LOCALID number.
    """
    userCredentials: UserIdValueAndTypeInput!
    """
    Globally unique user ID and type.
    """
    globalUID: GlobalUIDInput
    """
    The user's 3-digit municipality number.
    """
    municipalityNo: String
    """
    If dryRun is set to true, the service will not be called.
    """
    dryRun: Boolean!
  ) : CulrResponse!

  """
  Method to update an account, only supports updating the municipality number.
  """
  updateAccount(
    """
    The library where the given action is associated.
    """
    agencyId: String!
    """
    The user's type and value. For example, CPR and CPR number or LOCALID and LOCALID number.
    """
    userCredentials: UserIdValueAndTypeInput!
    """
    The user's 3-digit municipality number.
    """
    municipalityNo: String
    """
    If dryRun is set to true, the service will not be called.
    """
    dryRun: Boolean!
  ) : CulrResponse!

  """
  Method to delete a user's account. If it is the user's last account, the patron will also be deactivated.
  """
  deleteAccount(
    """
    The library where the given action is associated.
    """
    agencyId: String!
    """
    The user's type and value. For example, CPR and CPR number or LOCALID and LOCALID number.
    """
    userCredentials: UserIdValueAndTypeInput!
    """
    If dryRun is set to true, the service will not be called.
    """
    dryRun: Boolean!
  ) : CulrResponse!

  """
  Method to delete all accounts under a specific provider.
  """
  deleteAccountsFromProvider(
    """
    The library where the given action is associated.
    """
    agencyId: String!
    """
    If dryRun is set to true, the service will not be called.
    """
    dryRun: Boolean!
  ) : CulrResponse!
}

extend type Mutation {
  culr: CulrMutate!
}

extend type Query {
  culr: CulrQuery!
}
 `;

export const resolvers = {
  Mutation: {
    async culr(parent, args, context, info) {
      return {};
    },
  },

  Query: {
    async culr(parent, args, context, info) {
      return {};
    },
  },

  CulrMutate: {
    async createAccount(parent, args, context, info) {
      const { dryRun } = args;

      if (dryRun) {
        return {
          hasCulrAccount: null,
          responseStatus: {
            responseCode: "OK_200",
            responseMessage: null,
          },
        };
      }

      // Create account
      return await context.datasources.getLoader("createAccount").load(args);
    },

    async updateAccount(parent, args, context, info) {
      const { dryRun } = args;

      if (dryRun) {
        return {
          hasCulrAccount: null,
          responseStatus: {
            responseCode: "OK_200",
            responseMessage: null,
          },
        };
      }

      // Update user account by provided credentials
      return await context.datasources.getLoader("updateAccount").load(args);
    },

    async deleteAccount(parent, args, context, info) {
      const { dryRun } = args;

      if (dryRun) {
        return {
          hasCulrAccount: null,
          responseStatus: {
            responseCode: "OK_200",
            responseMessage: null,
          },
        };
      }

      // Get the account by global credentials
      return await context.datasources.getLoader("deleteAccount").load(args);
    },

    async deleteAccountsFromProvider(parent, args, context, info) {
      const { agencyId, dryRun } = args;

      if (dryRun) {
        return {
          hasCulrAccount: null,
          responseStatus: {
            responseCode: "OK_200",
            responseMessage: null,
          },
        };
      }

      // Delete all provider accounts
      return await context.datasources
        .getLoader("deleteAllAccountsFromProvider")
        .load({ agencyId });
    },
  },

  CulrQuery: {
    async getAccountsByGlobalId(parent, args, context, info) {
      const { userCredentials } = args;

      // Get the account by global credentials
      return await context.datasources
        .getLoader("getAccountsByGlobalId")
        .load({ userCredentials });
    },

    async getAccountsByLocalId(parent, args, context, info) {
      const { userCredentials } = args;

      // Get the account by local credentials
      return await context.datasources
        .getLoader("getAccountsByLocalId")
        .load({ userCredentials });
    },

    async hasCulrAccount(parent, args, context, info) {
      const { guid } = args;

      // Check if an account exist for the provided guid
      return await context.datasources
        .getLoader("hasCulrAccount")
        .load({ guid });
    },

    async getAccountFromProvider(parent, args, context, info) {
      const { agencyId, userCredentials } = args;

      // get user accounts for the provided credentials
      return await context.datasources
        .getLoader("getAccountFromProvider")
        .load({ agencyId, userCredentials });
    },
  },

  CulrAccountResponse: {
    accounts(parent, args, context, info) {
      return parent?.account || [];
    },
  },

  CulrResponseStatus: {
    code(parent, args, context, info) {
      return parent?.responseCode;
    },
    message(parent, args, context, info) {
      return parent?.responseMessage;
    },
  },
};
