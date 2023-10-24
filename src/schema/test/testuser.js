/**
 * @file Schema and resolvers for managing FBI-API test users
 */

import { getTestUser, storeTestUser } from "../../utils/testUserStore";

export const typeDef = `

"""

"""
type AgencyAccount {
  agency: Branch
  uniqueId: String
  cpr: String
  debt: String
  blocked: Boolean
  isMunicipality: Boolean
}
type TestUser {
  """
  All agencies which the user is registered on
  """
  accounts: [AgencyAccount!]
}

type Test {
  user: TestUser
}


input AgencyAccountInput {
  agency: String
  cpr: String
  debt: String
  blocked: Boolean
  isMunicipality: Boolean
}

input TestUserInput {
  accounts: [AgencyAccountInput!]
}

type TestMutation {
  user(input: TestUserInput): String
}

extend type Query {
  test: Test
}

extend type Mutation {
  test: TestMutation
}
`;

export const resolvers = {
  AgencyAccount: {
    async agency(parent, args, context, info) {
      return (
        (
          await context.datasources.getLoader("library").load({
            branchId: parent.agency,
            limit: 1,
            status: "ALLE",
          })
        )?.result?.[0] || { agencyName: "nemlogin", agencyId: parent.agency }
      );
    },
    blocked(parent) {
      return !!parent.blocked;
    },
    isMunicipality(parent) {
      return !!parent.isMunicipality;
    },
  },
  Test: {
    async user(parent, args, context, info) {
      console.log({ context });
      return getTestUser(context);
    },
  },
  Query: {
    async test(parent, args, context, info) {
      return {};
    },
  },
  TestMutation: {
    async user(parent, args, context, info) {
      const input = args.input;
      await storeTestUser(input, context);

      return "OK";
    },
  },
  Mutation: {
    async test(parent, args, context, info) {
      return {};
    },
  },
};
