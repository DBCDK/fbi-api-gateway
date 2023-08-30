/**
 * @file availability type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";

import { getUserOrderAllowedStatus } from "../utils/utils";

export const typeDef = `
   type SubmitOrder {
    """
    if order was submitted successfully
    """
    ok: Boolean,
    status: String,
    orderId: String,
    deleted: Boolean,
    orsId: String
   }

   enum OrderType {
      ESTIMATE,
      HOLD,
      LOAN,
      NON_RETURNABLE_COPY,
      NORMAL,
      STACK_RETRIEVAL
   }

   input SubmitOrderUserParameters {
      cpr: String,
      userId: String,
      barcode: String,
      cardno: String,
      customId: String,
      userDateOfBirth: String,
      userName: String,
      userAddress: String,
      userMail: String,
      userTelephone: String
   }

   input SubmitOrderInput{
    orderType: OrderType,
    pids: [String!]!,
    pickUpBranch: String!,
    exactEdition: Boolean
    expires: String
    userParameters: SubmitOrderUserParameters!
    author: String
    authorOfComponent: String
    pagination: String
    publicationDate: String
    publicationDateOfComponent: String
    title: String
    titleOfComponent: String
    volume: String
  } 
  
  type DeleteOrderResponse {

    """
    Whether the order was deleted or not
    """
    deleted: Boolean!

    """
    Error message
    """
    error: String
  }
  type OrderStatusResponse {
    """
    Unique id for the order
    """
    orderId: String!

    """
    Whether the order is open or closed
    """
    closed: Boolean

    """
    Indicates if the order has been automated
    """
    autoForwardResult: String
    
    """
    Confirms a reservation has been made 
    """
    placeOnHold: String
        
    """
    The branch where the user should collect the material
    """
    pickupAgencyId: String
    
    """
    pid associated with the order
    """
    pid: String
    
    """
    Unique identifier of the primary bibliographic object. Useful if a collection consists of multiple objects.
    """
    pidOfPrimaryObject: String

    """
    Author of the material
    """
    author: String
    
    """
    Title of the material
    """
    title: String
    
    """
    Date and time when the order was created
    """
    creationDate: String
    """
    Error message if ors-maintenance request fails
    """
    errorMessage: String
   }

   extend type Mutation {
    submitOrder(input: SubmitOrderInput!, dryRun: Boolean): SubmitOrder
  }

  `;

/**
 * Resolvers for the Profile type
 */
export const resolvers = {
  Mutation: {
    async submitOrder(parent, args, context, info) {
      if (!context?.smaug?.orderSystem) {
        throw "invalid smaug configuration [orderSystem]";
      }

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

      const agencyId = branch.agencyId;

      const userId =
        context?.smaug?.user?.id || args.input?.userParameters?.userId;

      const { ok, status } = await getUserOrderAllowedStatus(
        { agencyId, userId },
        context
      );

      if (!ok) {
        return { ok, status };
      }

      const input = {
        ...args.input,
        accessToken: context.accessToken,
        smaug: context.smaug,
        dryRun: args.dryRun,
        branch,
      };

      const submitOrderRes = await context.datasources
        .getLoader("submitOrder")
        .load(input);

      //if the request is coming from beta.bibliotek.dk, add the order id to userData service
      if (context?.profile?.agency == 190101) {
        const orderId = submitOrderRes?.orderId;
        const smaugUserId = context?.smaug?.user?.uniqueId;
        try {
          if (!smaugUserId) {
            throw new Error("Not authorized");
          }
          if (!orderId) {
            throw new Error("Undefined orderId");
          }
          await context.datasources.getLoader("userDataAddOrder").load({
            smaugUserId: smaugUserId,
            orderId: orderId,
          });
        } catch (error) {
          log.error(
            `Failed to add order to userData service. Message: ${
              error.message || JSON.stringify(error)
            }`
          );
        }
      }

      return submitOrderRes;
    },
  },

  SubmitOrderInput: {
    // map ordertype to enum
    async orderType(parent, args, context, info) {
      return (
        {
          Estimate: "ESTIMATE",
          Hold: "HOLD",
          Loan: "LOAN",
          "Non-returnable Copy": "NON_RETURNABLE_COPY",
          normal: "NORMAL",
          "Stack Retrieval": "STACK_RETRIEVAL",
        }[parent.orderType] || "UNKNOWN"
      );
    },
  },
};
