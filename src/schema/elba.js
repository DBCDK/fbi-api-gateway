import { resolveBorrowerCheck, resolveOnlineAccess } from "../utils/utils";

export const typeDef = `

 enum CopyRequestStatus {
   OK
   ERROR_UNAUTHORIZED_USER
   ERROR_AGENCY_NOT_SUBSCRIBED
   ERROR_INVALID_PICKUP_BRANCH
   ERROR_PID_NOT_RESERVABLE
 }

 type CopyRequestResponse {
    status: CopyRequestStatus!
 }

 type ElbaServices {
   placeCopyRequest(input: CopyRequestInput!): CopyRequestResponse!
 }

input CopyRequestInput {

    """
    The pid of an article or periodica
    """
    pid: String!

    pickUpBranch: String!

    userName: String,
    userMail: String
    publicationTitle: String
    publicationDate: String
    publicationYear: String
    volume: String
    author: String
    title: String
    pagination: String
    dbcOrderId: String
    userLoanerId: String
    userInterestDate: String
    agencyId: String
    pickUpAgencySubdivision: String
    issue: String
    openURL: String
     
    """
    If this is true, the copy request will not be send to the elba service
    Use it for testing
    """
    dryRun: Boolean
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
      const { pid, userName, userMail, agencyId } = args.input;

      // Basic user information
      const userData = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });

      // Detailed user informations (e.g. municipalityAgencyId)
      const userInfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });

      const user = { ...userData, ...userInfo?.attributes };

      // Ensure a pair of email and name can be set
      if (!((userName || user.name) && (userMail || user.mail))) {
        return {
          status: "ERROR_UNAUTHORIZED_USER",
        };
      }

      // Fetch list of digitalAccess subscribers
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");

      // Fetch list of infomedia subscribers
      const infomediaSubscriptions = await context.datasources
        .getLoader("idp")
        .load("");

      // Check that users municipalityAgencyId is a digitalAccess subscriber
      const matches = await context.datasources.getLoader("library").load({
        branchId: user.municipalityAgencyId,
        digitalAccessSubscriptions,
        infomediaSubscriptions,
      });

      const branch = matches.result[0];

      if (!branch) {
        return {
          status: "ERROR_INVALID_PICKUP_BRANCH",
        };
      }

      // check if matching branch has borchk configured
      const hasBorrowerCheck = await resolveBorrowerCheck(
        branch.agencyId,
        context
      );

      // If branch has borrowerCheck, we require the user to be authenticated via that agency
      if (hasBorrowerCheck) {
        if (!context?.smaug?.user?.id) {
          return {
            status: "ERROR_UNAUTHORIZED_USER",
          };
        }
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

      await context.datasources
        .getLoader("statsbiblioteketSubmitArticleOrder")
        .load({
          ...args.input,
          userName: userName || user.name,
          userMail: userMail || user.mail,
          agencyId: agencyId || branch.agencyId,
        });

      // Then send order
      try {
        log.info("Periodica article order succes", {
          args,
          accessToken: context.accessToken,
        });

        return { status: "OK" };
      } catch (e) {
        return { status: "OK" };

        log.error("Periodica article order failed", e);
        return {
          status: "ERROR_PID_NOT_RESERVABLE",
        };
      }

      return "OK";
    },
  },
};
