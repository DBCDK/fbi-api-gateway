/**
 * @file availability type definition and resolvers
 *
 */

import isEmpty from "lodash/isEmpty";
import { log } from "dbc-node-logger";
import { placeCopyRequest } from "./elba";
import { filterAgenciesByProps } from "../utils/accounts";
import { isPeriodica, resolveBorrowerCheck } from "../utils/utils";
import { isFFUAgency, hasCulrDataSync } from "../utils/agency";

import getUserBorrowerStatus, {
  getUserIds,
} from "../utils/getUserBorrowerStatus";

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
  UNKNOWN_ERROR: "Some unknown error occured",
  ERROR_MISSING_PINCODE: "No pincode was provided for FFU agency",
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
    UNKNOWN_ERROR

    """
    Pincode was not found in arguments
    """
    ERROR_MISSING_PINCODE
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

   type SubmitMultipleOrders {
    failedAtCreation: [String!]!,
    successfullyCreated: [String!]!,
    ok: Boolean
    status: String
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
      pincode: String,
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
    key: String,
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

  input Material {
    pids: [String!]!
    key: String!
    publicationDate: String
    publicationDateOfComponent: String
    volume: String
    author: String
    authorOfComponent: String
    titleOfComponent: String
    title: String
    exactEdition: Boolean
    expires: String
    orderType: OrderType
    periodicaForm: CopyRequestInput
  }

  input CopyRequestInput {

    """
    The pid of an article or periodica
    """
    pid: String!

    userName: String
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

  input SubmitMultipleOrdersInput{
    materialsToOrder: [Material!]!
    pickUpBranch: String!
    userParameters: SubmitOrderUserParameters!
    pagination: String
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
    submitMultipleOrders(input: SubmitMultipleOrdersInput!, dryRun: Boolean): SubmitMultipleOrders
  }
  `;

const saveOrderToUserdata = async ({ context, submitOrderRes, pid, user }) => {
  //if the request is coming from beta.bibliotek.dk, add the order id to userData service
  if (context?.profile?.agency == 190101) {
    const orderId = submitOrderRes?.orderId;
    const uniqueId = user?.uniqueId;

    try {
      if (!uniqueId) {
        throw new Error("Not authorized");
      }
      if (!orderId) {
        throw new Error("Undefined orderId");
      }
      if (!pid) {
        throw new Error("Undefined pid");
      }
      await context.datasources.getLoader("userDataAddOrder").load({
        uniqueId,
        orderId,
        pid,
      });
    } catch (error) {
      log.error(
        `Failed to add order to userData service. Message: ${
          error.message || JSON.stringify(error)
        }`
      );
    }
  }
};
/**
 *
 * Save pickup branch in userdata as last used pickup branch. Used when user is not signed in with a specific branch.(e.g. with MitID)
 */
async function saveLastUsedBranch({ uniqueId, pickUpBranch, context }) {
  try {
    await context.datasources.getLoader("userdataLastUsedPickupBranch").load({
      uniqueId: uniqueId,
      lastUsedPickUpBranch: pickUpBranch,
    });
  } catch (error) {
    log.error(
      `Failed to update last used branch. Message: ${
        error.message || JSON.stringify(error)
      }`
    );
  }
}

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

      const user = context?.user;

      const userParameters = args?.input?.userParameters;

      // PickUpBranch agencyId
      const agencyId = branch?.agencyId;

      // userIds from userParameters
      const userIds = getUserIds(userParameters);

      // If authentification has been done through an FFU agency - a pincode is needed for further validation
      // before an order can be placed at that specific agency.
      let userPincode = null;

      const hasBorchk = await resolveBorrowerCheck(branch.branchId, context);

      if ((await isFFUAgency(agencyId, context)) && hasBorchk) {
        const isTrustedAuthentication = await hasCulrDataSync(
          user?.loggedInAgencyId,
          context
        );
        userPincode = !isTrustedAuthentication && userParameters?.pincode;

        if (!isTrustedAuthentication && !userPincode) {
          return {
            message: "",
            status: "ERROR_MISSING_PINCODE",
          };
        }
      }

      // Verify that the user is allowed to place an order
      const { status, statusCode, userId } = await getUserBorrowerStatus(
        { agencyId, userIds, userPincode },
        context
      );

      if (!status) {
        return { ok: status, status: statusCode };
      }

      const authUserId = user?.userId;

      // We assume we will get the verified userId from the 'getUserBorrowerStatus' check.
      // If NOT (e.g. no borchk possible for agency), we fallback to an authenticated id and then an user provided id.
      if (!userId && !authUserId && isEmpty(userIds)) {
        // Order is not possible if no userId could be found or was provided for the user
        return {
          ok: false,
          status: "UNKNOWN_USER",
        };
      }

      // return if dryrun
      if (args.dryRun) {
        return {
          ok: true,
          status: "OWNED_ACCEPTED",
          orderId: "1234",
          orsId: "4321",
          deleted: false,
        };
      }

      // Place order
      const submitOrderRes = await context.datasources
        .getLoader("submitOrder")
        .load({
          userId: userId || authUserId || userIds.userId,
          branch,
          input: args.input,
          accessToken: context.accessToken,
          smaug: context.smaug,
          authUserId,
        });

      //first pid in pids to order
      const pidToOrder = args.input.pids[0];
      await saveOrderToUserdata({
        context,
        submitOrderRes,
        pid: pidToOrder,
        user,
      });
      //store branch as last used pickup branch
      await saveLastUsedBranch({
        uniqueId: user?.uniqueId,
        pickUpBranch: args?.input?.pickUpBranch,
        context,
      });

      return submitOrderRes;
    },
    async submitMultipleOrders(parent, args, context, info) {
      const successfullyCreated = [];
      const failedAtCreation = [];
      const materialsToOrder = args?.input?.materialsToOrder;

      if (!materialsToOrder || materialsToOrder.length === 0) {
        return {
          successfullyCreated,
          failedAtCreation,
          ok: false,
          status: "NO_MATERIALS_TO_ORDER",
        };
      }

      if (!context?.smaug?.orderSystem) {
        throw "invalid smaug configuration [orderSystem]";
      }
      const branch = (
        await context.datasources.getLoader("library").load({
          branchId: args?.input?.pickUpBranch,
        })
      ).result?.[0];

      if (!branch) {
        return {
          successfullyCreated,
          failedAtCreation: getAllKeys(materialsToOrder),
          ok: false,
          status: "UNKNOWN_PICKUPAGENCY",
        };
      }

      const user = context?.user;

      const userParameters = args?.input?.userParameters;

      const userMail = userParameters?.userMail;

      // PickUpBranch agencyId
      const agencyId = branch?.agencyId;

      // userIds from userParameters
      const userIds = getUserIds(userParameters);

      // If authentification has been done through an FFU agency - a pincode is needed for further validation
      // before an order can be placed at that specific agency.
      let userPincode = null;

      const hasBorchk = await resolveBorrowerCheck(branch.branchId, context);

      if ((await isFFUAgency(agencyId, context)) && hasBorchk) {
        const isTrustedAuthentication = await hasCulrDataSync(
          user?.loggedInAgencyId,
          context
        );
        userPincode = !isTrustedAuthentication && userParameters?.pincode;

        if (!isTrustedAuthentication && !userPincode) {
          return {
            status: "ERROR_MISSING_PINCODE",
          };
        }
      }

      // Verify that the user is allowed to place an order
      const { status, statusCode, userId } = await getUserBorrowerStatus(
        { agencyId, userIds, userPincode },
        context
      );

      if (!status) {
        return {
          successfullyCreated,
          failedAtCreation: getAllKeys(materialsToOrder),
          ok: false,
          status: statusCode,
        };
      }

      // We assume we will get the verified userId from the 'getUserBorrowerStatus' check.
      // If NOT (e.g. no borchk possible for agency), we fallback to an authenticated id and then an user provided id.
      if (!userId && !user?.userId && isEmpty(userIds)) {
        // Order is not possible if no userId could be found or was provided for the user
        return {
          successfullyCreated,
          failedAtCreation: getAllKeys(materialsToOrder),
          ok: false,
          status: "UNKNOWN_USER",
        };
      }

      // Verify that the user has an account at the municiaplityAgencyId (created as loaner)
      const account = filterAgenciesByProps(user.agencies, {
        agency: user.municipalityAgencyId,
      })?.[0];

      // Fetch list of digitalAccess subscribers
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");

      const hasDigitalArticleService =
        !!digitalAccessSubscriptions[user.municipalityAgencyId] && !!account;

      const nonPeriodicaOrders = materialsToOrder.filter(
        (material) => !isPeriodica(material.periodicaForm)
      );

      const periodicaOrders = materialsToOrder.filter((material) =>
        isPeriodica(material.periodicaForm)
      );

      // Place periodica orders
      if (hasDigitalArticleService) {
        await Promise.all(
          periodicaOrders.map(async (material) => {
            if (args.dryRun) {
              // return if dryrun
              successfullyCreated.push(material.key);
              return;
            }

            const placeCopyArgs = {
              ...material?.periodicaForm,
              userParameters: args?.input?.userParameters,
              pickupBranch: branch.agencyId,
              userMail: userMail,
              agencyId: branch.agencyId,
            };
            const submitOrderRes = await placeCopyRequest({
              input: placeCopyArgs,
              dryRun: args.dryRun,
              context,
            });
            if (!submitOrderRes || submitOrderRes.status !== "OK") {
              // Creation failed
              failedAtCreation.push(material.key);
              return;
            }
            successfullyCreated.push(material.key);

            //TODO  - we dont save single periodica orders to userData, therefor i dont save multi-periodica either
            //await saveOrderToUserdata(user, submitOrderRes, context);
          })
        );
      }

      //Place other orders

      //flatten all orders with periodicaForm, can i either be digital article orders OR physical periodica orders
      const flattenedOrders = (hasDigitalArticleService
        ? nonPeriodicaOrders
        : materialsToOrder
      )?.map((order) => {
        const { periodicaForm, ...restOfOrder } = order;
        return {
          ...restOfOrder,
          ...periodicaForm,
        };
      });

      //Place send nonPeriodicaOrders as they are
      // flatten input to spread periodicaFrom into the input, then send them via submitOrder
      await Promise.all(
        flattenedOrders?.map(async (material) => {
          if (args.dryRun) {
            // return if dryrun
            successfullyCreated.push(material.key);
            return;
          }
          // Place order
          const submitOrderRes = await context.datasources
            .getLoader("submitOrder")
            .load({
              userId: userId || user?.userId || userIds.userId,
              branch,
              input: { ...args.input, ...material, key: null },
              accessToken: context.accessToken,
              smaug: context.smaug,
            });

          if (!submitOrderRes || !submitOrderRes.ok) {
            // Creation failed
            failedAtCreation.push(material.key);
            return;
          }
          successfullyCreated.push(material.key);

          const pidToOrder = material.pids[0];
          await saveOrderToUserdata({
            context,
            submitOrderRes,
            pid: pidToOrder,
            user,
          });
        })
      );
      //store branch as last used pickup branch
      await saveLastUsedBranch({
        uniqueId: user?.uniqueId,
        pickUpBranch: args?.input?.pickUpBranch,
        context,
      });

      return {
        successfullyCreated,
        failedAtCreation,
        ok:
          failedAtCreation.length === 0 &&
          successfullyCreated.length === materialsToOrder.length,
        status: "OK",
      };
    },
  },

  SubmitOrder: {
    ok(parent, args, context, info) {
      return parent.ok || false;
    },
    status(parent, args, context, info) {
      return parent.status?.toUpperCase() || "UNKNOWN_ERROR";
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

const getAllKeys = (materialsToOrder) => {
  const keys = [];
  materialsToOrder?.forEach((material) => {
    keys.push(material.key);
  });
  return keys;
};
