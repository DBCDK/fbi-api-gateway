/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

export const typeDef = `

enum CulrResponseCodesEnum {
  OK200
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
  Den specifikke globalt unikke type.
  """
  uidType: GlobalUidTypesEnum!
  """
  Den globalt unikke types værdi.
  """
  uidValue: String!
}

input LocalUIDInput {
  """
  Biblioteksnummer i form af et 6-cifret nummer.
  """
  agencyId: String!
  """
  Brugerens identifikation på det givne bibliotek.
  """
  userIdValue: String!
}

type Account {
  """
  AgencyId på den provider der har oprettet den givne account.
  """
  provider: String
  """
  Typen på den givne account.
  """
  userIdType: UserIdTypesEnum
  """
  Typens værdi.
  """
  userIdValue: String
}

type CulrResponseStatus {
  """
  Status kode på svaret.
  """
  code: CulrResponseCodesEnum
  """
  Hvis svaret ikke er OK200 kan der i dette felt stå en forklaring på eventuelle fejl.
  """
  message: String
}

type CulrResponse {
  """
  Hvis den givne GUID tekst streng findes i CULR. Er kun sat hvis der svares tilbage på et kald af hasculraccount.
  """
  hasCulrAccount: Boolean
  """
  Status på det udførte kald.
  """
  responseStatus: CulrResponseStatus!
}

type CulrAccountResponse {
  """
  Liste af brugerens accounts.
  """
  accounts: [Account]!
  """
  Kommunenummer hvis det er sat på brugerens patron.
  """
  municipalityNo: String
  """
  GUID tilknyttet brugerens patron hvis det findes.
  """
  guid: String
  """
  Status på det udførte kald.
  """
  responseStatus: CulrResponseStatus!
}

type CulrQuery {
  """
  Metode til at hente alle accounts under brugerens patron baseret på enten CPR, CiceroUid eller SystemUid.
  """  
  getAccountsByGlobalId(

  """
  Globalt unikke brugerid og type
  """
  userCredentials: GlobalUIDInput!) : CulrAccountResponse

  """
  Metode til at hente alle accounts under brugerens patron baseret på localId.
  """
  getAccountsByLocalId(

  """
  Brugerens agencyId og lokalId
  """
  userCredentials: LocalUIDInput!) : CulrAccountResponse

  """
  Metode til at validere om et uuid guid findes i culr.
  """
  hasCulrAccount(
  """
  GUID tekst streng der ønskes tjekket.
  """
  guid: String!): CulrResponse
}

type CulrMutate {
  createAccount: String
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
      return "hej";
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
  },

  CulrAccountResponse: {
    accounts(parent, args, context, info) {
      return parent.account;
    },
  },

  CulrResponseStatus: {
    code(parent, args, context, info) {
      return parent.responseCode;
    },
    message(parent, args, context, info) {
      return parent.responseMessage;
    },
  },
};
