/**
 * @file availability type definition and resolvers
 *
 */

import { log } from "dbc-node-logger";

import getUserOrderAllowedStatus from "../utils/userOrderAllowedStatus";

const orderStatusmessageMap = {
  OWNED_ACCEPTED: "Item available at pickupAgency, order accepted",
  NOT_OWNED_ILL_LOC:
    "Item not available at pickupAgency, item localised for ILL",
  OWNED_WRONG_MEDIUMTYPE:
    "Item available at pickupAgency, order of mediumType not accepted",
  NOT_OWNED_WRONG_ILL_MEDIUMTYPE:
    "Item not available at pickupAgency, ILL of mediumType not accepted",
  NOT_OWNED_NO_ILL_LOC:
    "Item not available at pickupAgency, item not localised for ILL",
  OWNED_OWN_CATALOGUE:
    "Item available at pickupAgency, item may be ordered through the library's catalogue",
  SERVICE_UNAVAILABLE: "Service unavailable",
  UNKNOWN_PICKUPAGENCY: "PickupAgency not found",
  UNKNOWN_USER: "User not found",
  INVALID_ORDER: "Order does not validate",
  ORS_ERROR: "Error sending order to ORS",
  NO_SERVICEREQUESTER: "ServiceRequester is obligatory",
  AUTHENTICATION_ERROR: "Authentication error",
  UNKNOWN_STATUS: "Some unknown error occured",
};

/**
 * First block contains user validation status' from util function
 *
 * Last block includes status' from openorder (ORS)
 */

export const typeDef = `
  enum SubmitOrderStatus {
    """
    Borchk: User is blocked by agency
    """
    BORCHK_USER_BLOCKED_BY_AGENCY

    """
    Borchk: User is no longer loaner at the provided pickupbranch
    """
    BORCHK_USER_NO_LONGER_EXIST_ON_AGENCY 

    """
    Borchk: User could not be verified
    """
    BORCHK_USER_NOT_VERIFIED



    """
    Item available at pickupAgency, order accepted
    """
    OWNED_ACCEPTED

    """
    Item not available at pickupAgency, item localised for ILL
    """
    NOT_OWNED_ILL_LOC

    """
    Item available at pickupAgency, order of mediumType not accepted
    """
    OWNED_WRONG_MEDIUMTYPE
    
    """
    Item not available at pickupAgency, ILL of mediumType not accepted
    """
    NOT_OWNED_WRONG_ILL_MEDIUMTYPE

    """
    Item not available at pickupAgency, item not localised for ILL
    """
    NOT_OWNED_NO_ILL_LOC

    """
    Item available at pickupAgency, item may be ordered through the library's catalogue
    """
    OWNED_OWN_CATALOGUE
    
    """ 
    Service unavailable
    """
    SERVICE_UNAVAILABLE

    """
    PickupAgency not found
    """
    UNKNOWN_PICKUPAGENCY

    """
    User not found
    """
    UNKNOWN_USER

    """
    Order does not validate
    """
    INVALID_ORDER

    """
    Error sending order to ORS
    """
    ORS_ERROR

    """
    ServiceRequester is obligatory
    """
    NO_SERVICEREQUESTER

    """
    Authentication error
    """
    AUTHENTICATION_ERROR



    """
    Unknown error occured, status is unknown
    """
    UNKNOWN_STATUS
  }

   type SubmitOrder {
    """
    if order was submitted successfully
    """
    ok: Boolean,
    status: SubmitOrderStatus!,
    message: String,
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
      ).result?.[0];

      if (!branch) {
        return {
          status: "UNKNOWN_PICKUPAGENCY",
        };
      }

      const agencyId = branch.agencyId;

      // Verify that the user is allowed to place an order
      const { status, statusCode } = await getUserOrderAllowedStatus(
        { agencyId },
        context
      );

      if (!status) {
        return { ok: status, status: statusCode };
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

  SubmitOrder: {
    ok(parent, args, context, info) {
      return parent.ok || false;
    },
    status(parent, args, context, info) {
      return parent.status?.toUpperCase() || "UNKNOWN_STATUS";
    },
    message(parent, args, context, info) {
      return orderStatusmessageMap[parent.status];
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
