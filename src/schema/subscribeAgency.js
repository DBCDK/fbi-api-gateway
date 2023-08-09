export const typeDef = `

enum SubscribeAgencyStatus {
    OK
    ERROR_UNAUTHENTICATED_USER
  }
 
input SubscribeAgencyInput {
    """
    The agencyId
    """
    agencyId: String!
}

type SubscribeAgencyResponse {
    status: SubscribeAgencyStatus!
}

type CulrService {

    """
    Subscribe an agency to a CPR validated user
    """
    subscribeAgency(input: SubscribeAgencyInput!, 

    """
    If dryRun is set to true, the actual service is never called
    Used for testing
    """
    dryRun: Boolean): SubscribeAgencyResponse!
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
    async subscribeAgency(parent, args, context, info) {
      const input = {
        ...args.input,
        accessToken: context.accessToken,
        smaug: context.smaug,
        agencyId: args.input.agencyId,
      };

      console.log("context?.smaug", context?.smaug);

      // token is not authenticated
      if (!context?.smaug?.user?.uniqueId) {
        return {
          status: "ERROR_UNAUTHENTICATED_USER",
        };
      }

      return { status: "OK" };

      // return await context.datasources.getLoader("submitOrder").load(input);
    },
  },
};
