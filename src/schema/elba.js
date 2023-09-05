import { resolveAccess } from "./draft/draft_utils_manifestations";
import { getHomeAgencyAccount } from "../utils/utils";
import getUserOrderAllowedStatus from "../utils/userOrderAllowedStatus";

export const typeDef = `

 enum CopyRequestStatus {
   OK
   ERROR_UNAUTHENTICATED_USER
   ERROR_AGENCY_NOT_SUBSCRIBED
   ERROR_INVALID_PICKUP_BRANCH
   ERROR_PID_NOT_RESERVABLE
   ERROR_MISSING_CLIENT_CONFIGURATION
   ERROR_MUNICIPALITYAGENCYID_NOT_FOUND

   UNKNOWN_USER
   BORCHK_USER_BLOCKED_BY_AGENCY
   BORCHK_USER_NO_LONGER_EXIST_ON_AGENCY
   BORCHK_USER_NOT_VERIFIED
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

      const originRequester =
        context?.smaug?.digitalArticleService?.originRequester;

      if (!originRequester) {
        return {
          status: "ERROR_MISSING_CLIENT_CONFIGURATION",
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

      // Basic user information (e.g. name, email)
      let userData;
      try {
        const homeAccount = getHomeAgencyAccount(userInfo);
        userData = await context.datasources.getLoader("user").load({
          homeAccount: homeAccount,
          accessToken: context.accessToken, // Required for testing
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
          status: "ERROR_MISSING_MUNICIPALITYAGENCYID",
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
        const onlineAccess = await resolveAccess(pid, context);
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

      // Verify that the user is allowed to place an order
      // checking the municipality exist is redundant - but we still want the blocked check.
      const { status, statusCode } = await getUserOrderAllowedStatus(
        { agencyId: user.municipalityAgencyId },
        context
      );

      if (!status) {
        return { ok: status, status: statusCode };
      }

      // Then send order
      return await context.datasources
        .getLoader("statsbiblioteketSubmitArticleOrder")
        .load({
          ...args.input,
          userName: userName || user.name,
          userMail: userMail || user.mail,
          agencyId: user.municipalityAgencyId,
          pickUpBranch: user.agency,
          dryRun: args.dryRun,
          originRequester,
        });
    },
  },
};
