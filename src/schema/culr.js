import { isValidCpr } from "../utils/cpr";
import { isFFUAgency } from "../utils/agency";

export const typeDef = `

enum SubscribeAgencyStatus {
    OK
    ERROR_INVALID_CPR
    ERROR_INVALID_AGENCY
    ERROR_UNAUTHENTICATED_TOKEN

    ERROR_UNAUTHENTICATED_USER
    ERROR_USER_ALREADY_SUBSCRIBED
  }
 
input SubscribeAgencyInput {
    """
    The agencyId
    """
    agencyId: String!

    """
    The subscribing users local ID
    """
    localId: String!

    """
    The subscribing users CPR 
    """
    cpr: String!
}

type SubscribeAgencyResponse {
    status: SubscribeAgencyStatus!,
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
      // tjek om token er authenticated
      // tjek om CPR er valid
      // tjek om agency er FFU
      // tjek om bruger allerede er subscribed - egentlig ikke nødvendigt - håndteres også i culr

      /**
       * Cases:
       *
       * Der logges altid ind via borchk
       * Alle oprettes i CULR
       *
       * 1. Eksistere ikke i CULR
       *    - Validere med mitId - oprettes i CULR med CPR - tilknyttes FFU
       * 2. Eksistere i CULR men er logget ind med localID - tilnyttes FFU
       *    -
       */

      // console.log("context.smaug.......", context.smaug);

      // token is not authenticated - anonymous token used
      // Note that we check on 'id' and not the culr 'uniqueId' - as the user may not exist in culr
      if (!context?.smaug?.user?.id) {
        return {
          status: "ERROR_UNAUTHENTICATED_TOKEN",
        };
      }

      // validate cpr input
      if (!isValidCpr(args.input.cpr)) {
        return {
          status: "ERROR_INVALID_CPR",
        };
      }

      // validate Agency
      // if (!isFFUAgency(args.input.agencyId)) {
      //   return {
      //     status: "ERROR_INVALID_AGENCY",
      //   };
      // }

      // Check if user is already subscribed to agency
      const subscribtions = await context.datasources
        .getLoader("culrGetSubscribtionsById")
        .load({
          userId: args.input.cpr,
          agencyId: args.input.agencyId,
        });

      const accounts = subscribtions?.accounts;
      if (accounts?.find((acc) => acc.agencyId === args.input.agencyId)) {
        return {
          status: "ERROR_USER_ALREADY_SUBSCRIBED",
        };
      }

      return { status: "OK" };

      // Check if user is already subscribed to agency
      // const isSubscribed = userinfo?.attributes?.agencies?.find(
      //   (agency) => agency.agencyId === input.agencyId
      // );

      // Get agencies informations from login.bib.dk /userinfo endpoint
      const response = await context.datasources
        .getLoader("culrCreateSubscribtion")
        .load({
          accessToken: context.accessToken,
        });

      console.log("########", { userinfo });

      // return await context.datasources.getLoader("submitOrder").load(input);
    },
  },
};
