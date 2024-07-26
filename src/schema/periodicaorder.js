/**
 * @file Periodica article order type definition and resolvers
 *
 */

import { resolveBorrowerCheck } from "../utils/utils";

export const typeDef = `
 input PeriodicaArticleOrderInput {
    """
    The pid of an article or periodica
    """
    pid: String!
    pickUpBranch: String!
    userName: String
    userMail: String
    publicationDateOfComponent: String
    volume: String
    authorOfComponent: String
    titleOfComponent: String
    pagination: String
 }
 enum PeriodicaArticleOrderStatusEnum {
   OK
   ERROR_UNAUTHORIZED_USER
   ERROR_AGENCY_NOT_SUBSCRIBED
   ERROR_INVALID_PICKUP_BRANCH
   ERROR_PID_NOT_RESERVABLE
   ERROR_NO_NAME_OR_EMAIL
 }
 type PeriodicaArticleOrderResponse {
   status: PeriodicaArticleOrderStatusEnum!
 }

 extend type Mutation {
  submitPeriodicaArticleOrder(input: PeriodicaArticleOrderInput!, dryRun: Boolean): PeriodicaArticleOrderResponse! @deprecated(reason: "Use 'Elba.placeCopyRequest' instead")
}
 `;

export const resolvers = {
  Mutation: {
    async submitPeriodicaArticleOrder(parent, args, context, info) {
      let { userName, userMail } = args.input;

      const branch = (
        await context.datasources.getLoader("library").load({
          branchId: args.input.pickUpBranch,
        })
      ).result[0];

      if (!branch) {
        return {
          status: "ERROR_INVALID_PICKUP_BRANCH",
        };
      }

      const hasBorrowerCheck = await resolveBorrowerCheck(
        branch.agencyId,
        context
      );

      // If branch has borrowerCheck, we require the user to be authenticated via that agency
      if (hasBorrowerCheck) {
        if (!context?.user?.userId) {
          return {
            status: "ERROR_UNAUTHORIZED_USER",
          };
        }
        const agencyId = context?.user?.loggedInAgencyId;
        if (branch.agencyId !== agencyId) {
          return {
            status: "ERROR_INVALID_PICKUP_BRANCH",
          };
        }

        // We need users name and email
        const user = await context.datasources.getLoader("user").load({
          accessToken: context.accessToken,
        });

        userName = user.name ? user.name : userMail;
        userMail = user.mail ? user.mail : userMail;
      }

      if (!userName || !userMail) {
        return {
          status: "ERROR_NO_NAME_OR_EMAIL",
        };
      }

      // Agency must be subscribed
      const subscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");
      if (!subscriptions[branch.agencyId]) {
        return {
          status: "ERROR_AGENCY_NOT_SUBSCRIBED",
        };
      }

      // Pid must be a manifestation with a valid issn (valid journal)
      let issn;
      try {
        const onlineAccess = await resolveAccess(args.input.pid, context);
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
      const res = await context.datasources
        .getLoader("statsbiblioteketSubmitArticleOrder")
        .load({
          ...args.input,
          agencyId: branch.agencyId,
          dryRun: args.dryRun,
        });

      return res;
    },
  },
};
