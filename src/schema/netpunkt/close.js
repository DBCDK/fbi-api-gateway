export const typeDef = `

  input NetpunktCloseOrderInput {
    requesterId: String
    orderId: String
  }
  type Netpunkt {
    """
    Closes an order from Netpunkt to OpenOrder
    """
    closeOrder(input: NetpunktCloseOrderInput!, dryRun: Boolean): CloseOrder
  }
  extend type Mutation {
    """
    Netpunkt related mutations
    """
    netpunkt: Netpunkt!
  }
  
  type CloseOrder {
    orderId: String,
   }
`;

export const resolvers = {
  Mutation: {
    netpunkt() {
      return {};
    },
  },
  Netpunkt: {
    async closeOrder(parent, args, context) {
      // The userId of the Netpunkt user (not the end user)
      const authUser = context?.user;

      if (args?.dryRun) {
        return { orderId: "654321" };
      }
      if (args?.input?.requesterId !== authUser.netpunktAgency) {
        return {
          status: "REQUESTER_ID_NOT_EQUALvTO_LOGIN_ID",
        };
      }

      const branch = (
        await context.datasources.getLoader("library").load({
          branchId: args?.input?.requesterId,
        })
      ).result?.[0];

      if (!branch) {
        return {
          status: "UNKNOWN_REQUESTER_ID",
        };
      }

      //TODO: CHECK librarians agencyId compared to requesterId.
      return await context.datasources.getLoader("closeOrder").load({
        accessToken: context.accessToken,
        orderId: args.input?.orderId,
        requesterId: args.input?.requesterId
      });
    },
  },
};