import { resolveOnlineAccess } from "../utils/utils";
import { log } from "dbc-node-logger";

export const typeDef = `

 enum CopyRequestStatus {
   OK
   ERROR_UNAUTHENTICATED_USER
   ERROR_AGENCY_NOT_SUBSCRIBED
   ERROR_INVALID_PICKUP_BRANCH
   ERROR_PID_NOT_RESERVABLE
 }

 type CopyRequestResponse {
    status: CopyRequestStatus!
 }

 type ElbaServices {
   placeCopyRequest(input: CopyRequestInput!, 
    
    """
    If this is true, the copy request will not be send to the elba service
    Use it for testing
    """
    dryRun: Boolean): CopyRequestResponse!
 }

input CopyRequestInput {

    """
    The pid of an article or periodica
    """
    pid: String!

    userName: String,
    userMail: String
    publicationTitle: String
    publicationDateOfComponent: String
    publicationYearOfComponent: String
    volumeOfComponent: String
    authorOfComponent: String
    titleOfComponent: String
    pagesOfComponent: String
    userInterestDate: String
    pickUpAgencySubdivision: String
    issueOfComponent: String
    openURL: String
}

 extend type Mutation {
  elba: ElbaServices!
}
 `;

export const resolvers = {
  Mutation: {
    async elba(parent, args, context, info) {
      return {};
    },
  },
  ElbaServices: {
    async placeCopyRequest(parent, args, context, info) {
      const { pid, userName, userMail } = args.input;

      // token is not authenticated
      if (!context?.smaug?.user?.uniqueId) {
        return {
          status: "ERROR_UNAUTHENTICATED_USER",
        };
      }

      // Basic user information (e.g. name, email)
      let userData;
      try {
        userData = await context.datasources.getLoader("user").load({
          accessToken: context.accessToken,
        });
      } catch (e) {
        return {
          status: "ERROR_UNAUTHENTICATED_USER",
        };
      }

      // Detailed user informations (e.g. municipalityAgencyId)
      let userInfo;
      try {
        userInfo = await context.datasources.getLoader("userinfo").load({
          accessToken: context.accessToken,
        });
      } catch (e) {
        return {
          status: "ERROR_UNAUTHENTICATED_USER",
        };
      }

      const user = { ...userData, ...userInfo?.attributes };

      // Ensure a pair of email and name can be set
      if (!((userName || user.name) && (userMail || user.mail))) {
        return {
          status: "ERROR_UNAUTHENTICATED_USER",
        };
      }

      // Ensure user has municipalityAgencyId
      if (!user.municipalityAgencyId) {
        return {
          status: "ERROR_UNAUTHENTICATED_USER",
        };
      }

      // Fetch list of digitalAccess subscribers
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");

      if (!digitalAccessSubscriptions[user.municipalityAgencyId]) {
        return {
          status: "ERROR_AGENCY_NOT_SUBSCRIBED",
        };
      }

      // Pid must be a manifestation with a valid issn (valid journal)
      let issn;
      try {
        const onlineAccess = await resolveOnlineAccess(pid, context);
        issn = onlineAccess.find((entry) => entry.issn);
      } catch (e) {
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }

      if (!issn) {
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }

      // Then send order
      try {
        await context.datasources
          .getLoader("statsbiblioteketSubmitArticleOrder")
          .load({
            ...args.input,
            userName: userName || user.name,
            userMail: userMail || user.mail,
            agencyId: user.municipalityAgencyId,
            pickUpBranch: user.agency,
            dryRun: args.dryRun,
          });

        log.info("Elba: Periodica article order succes", {
          args,
          accessToken: context.accessToken,
        });

        return { status: "OK" };
      } catch (e) {
        log.error("Elba: Periodica article order failed", e);
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }
    },
  },
};
