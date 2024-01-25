import { filterAgenciesByProps } from "../utils/accounts";
import getUserBorrowerStatus from "../utils/getUserBorrowerStatus";

export const typeDef = `
type Agency {
    id: String!
    name: String
    type: AgencyType!
    numberOfBranches: Int!
    url: String!

    user: AgencyUser
    branches: [Branch!]!
    
    hitcount: Int!
    borrowerStatus: BorrowerStatus
    result: [Branch!]!
    agencyUrl: String
}

type AgencyUser{
    name: String
    mail: String,
    address: String,
    postalCode: String,
    country: String,
    blocked: Boolean!
}
`;

export const resolvers = {
  Agency: {
    id(parent, args, context, info) {
      return parent?.result?.[0]?.agencyId;
    },
    name(parent, args, context, info) {
      return parent?.result?.[0]?.agencyName;
    },
    type(parent, args, context, info) {
      return parent?.result?.[0]?.agencyType;
    },
    numberOfBranches(parent, args, context, info) {
      return parent.hitcount;
    },
    url(parent, args, context, info) {
      return (
        parent?.result[0]?.userStatusUrl ||
        parent?.result[0]?.branchWebsiteUrl ||
        ""
      );
    },

    async user(parent, args, context, info) {
      const user = context?.user;
      const agencyId = parent?.result?.[0]?.agencyId;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        agency: agencyId,
      })?.[0];

      const res = await context.datasources.getLoader("user").load({
        userId: account?.userId,
        agencyId: account?.agencyId,
      });

      return { ...res, agencyId };
    },

    branches(parent, args, context, info) {
      return parent.result;
    },

    hitcount(parent, args, context, info) {
      return parent.hitcount;
    },
    async borrowerStatus(parent, args, context, info) {
      const agencyId = parent.result?.[0]?.agencyId;

      const { status, statusCode } = await getUserBorrowerStatus(
        { agencyId },
        context
      );

      return {
        allowed: status,
        statusCode,
      };
    },
    result(parent, args, context, info) {
      return parent.result;
    },
    agencyUrl(parent, args, context, info) {
      return (
        parent?.result[0]?.userStatusUrl ||
        parent?.result[0]?.branchWebsiteUrl ||
        ""
      );
    },
  },
  AgencyUser: {
    async blocked(parent, args, context, info) {
      const agencyId = parent?.agencyId;

      const { status } = await getUserBorrowerStatus({ agencyId }, context);
      return !status;
    },
  },
};
