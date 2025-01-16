/**
 * @file Provides direct access for Netpunkt to Openorder.
 *
 * This functionality is necessary to allow librarians to create
 * loans on behalf of end users, ensuring efficient service
 * for library operations.
 */

export const typeDef = `
  type Netpunkt {
    """
    Submits an order from Netpunkt to OpenOrder on behalf of an end user
    """
    submitOrder(input: SubmitOrderInput!, dryRun: Boolean): SubmitOrder
  }
  extend type Mutation {
    """
    Netpunkt related mutations
    """
    netpunkt: Netpunkt!
  }
`;

export const resolvers = {
  Mutation: {
    netpunkt() {
      return {};
    },
  },
  Netpunkt: {
    async submitOrder(parent, args, context) {
      if (args?.dryRun) {
        return { status: "OWNED_ACCEPTED", orderId: "123456" };
      }

      // The userId of the Netpunkt user (not the end user)
      const authUserId = context?.user?.userId;

      const pickupBranch = args.input.pickUpBranch;

      const branch = (
        await context.datasources.getLoader("library").load({
          branchId: pickupBranch,
        })
      ).result?.[0];

      if (!branch) {
        return {
          status: "UNKNOWN_PICKUPAGENCY",
        };
      }

      return await context.datasources.getLoader("submitOrder").load({
        branch,
        input: args.input,
        accessToken: context.accessToken,
        smaug: context.smaug,
        authUserId,
      });
    },
  },
};
