/**
 * @file Profile type definition and resolvers
 *
 */

import {
  fetchOrderStatus,
  filterDuplicateAgencies,
  getHomeAgencyAccount,
  getUserBranchIds,
  resolveManifestation,
} from "../utils/utils";
import { log } from "dbc-node-logger";

/**
 * The Profile type definition
 */
export const typeDef = `
type User {
  name: String!
  favoritePickUpBranch: String
  """
  We can store userdata for more than 30 days if set to true.
  """
  persistUserData: Boolean!
  """
  Orders made through bibliotek.dk
  """
  bibliotekDkOrders(offset: Int limit: PaginationLimit): BibliotekDkOrders!
  agencies(language: LanguageCode): [BranchResult!]!
  agency(language: LanguageCode): BranchResult!
  address: String
  postalCode: String
  municipalityAgencyId: String
  mail: String
  culrMail: String
  country: String
  orders: [Order!]! @complexity(value: 5)
  loans: [Loan!]! @complexity(value: 5)
  debt: [Debt!]! @complexity(value: 3)
}
"""
Orders made through bibliotek.dk
"""
type BibliotekDkOrders {
result: [OrderStatusResponse!]
hitcount: Int!
}
type Loan {
  dueDate:	DateTime!
  loanId:	String!
  agencyId: String!
  edition: String
  pages: String
  publisher: String
  language: String
  manifestation: Manifestation
  materialType: String
}
enum OrderStatus {
  ACTIVE
  IN_PROCESS
  AVAILABLE_FOR_PICKUP
  EXPIRED
  REQUESTED_VIA_ILL
  AT_RESERVATION_SHELF
  UNKNOWN
}
type Order {
  orderId: String!,
  orderType: String
  status: OrderStatus!
  pickUpBranch: Branch!
  agencyId: String!
  holdQueuePosition: String
  orderDate: DateTime!
  creator: String
  title: String
  pickUpExpiryDate: DateTime
  manifestation: Manifestation
  edition: String
  language: String
  pages: String
  materialType: String
}
type Debt {
  amount: String!
  agencyId: String!
  creator: String
  currency: String
  date: DateTime
  title: String
}

type UserDataResponse {
  """
  Whether the operation was sucess or not
  """
  success: Boolean!
  
  """
  Error message if request fails
  """
  errorMessage: String  
}

type Mutation {
  """
  Add user to userdata service
  """
  addUserToUserDataService: UserDataResponse

  """
  Delete user from userdata service
  """
  deleteUserFromUserDataService: UserDataResponse

  """
  Add an orderId to a user. Will create user in userdata service if they dont exist
  """
  addOrderToUserData(orderId: String!): UserDataResponse
  
  """
  Remove order from userData service
  """
  deleteOrderFromUserData(orderId: String!): UserDataResponse
  
  """
  Set a favorite pickup branch. Will create user in userdata service if they dont exist
  """
  setFavoritePickUpBranch(favoritePickUpBranch: String!): UserDataResponse

  """
  Sets favoritePickUpBranch to null
  """
  clearFavoritePickUpBranch: UserDataResponse
  """
  Change users consent for storing order history for more than 30 days. If false, order history will be deleted after 30 days.
  """
  setPersistUserDataValue(persistUserData: Boolean!):UserDataResponse
  }

`;

function isEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

/**
 * returns true if input has CPR-number format (10 digits)
 * @param {String} uniqueId
 */
function isCPRNumber(uniqueId) {
  return /^\d{10}$/.test(uniqueId);
}

/**
 * Resolvers for the Profile type
 */
export const resolvers = {
  User: {
    async name(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });

      const homeAccount = getHomeAgencyAccount(userinfo);
      const res = await context.datasources.getLoader("user").load({
        homeAccount: homeAccount,
        accessToken: context.accessToken, // Required for testing
      });
      return res?.name;
    },

    async favoritePickUpBranch(parent, args, context, info) {
      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }
        if (isCPRNumber(smaugUserId)) {
          throw "User not found in CULR";
        }
        const res = await context.datasources
          .getLoader("userDataGetUser")
          .load({
            smaugUserId: smaugUserId,
          });
        return res?.favoritePickUpBranch || null;
      } catch (error) {
        return null;
      }
    },

    async persistUserData(parent, args, context, info) {
      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }
        if (isCPRNumber(smaugUserId)) {
          throw "User not found in CULR";
        }
        const res = await context.datasources
          .getLoader("userDataGetUser")
          .load({
            smaugUserId: smaugUserId,
          });
        return res?.persistUserData;
      } catch (error) {
        return null;
      }
    },

    async bibliotekDkOrders(parent, args, context, info) {
      const smaugUserId = context?.smaug?.user?.uniqueId;
      const { limit, offset } = args;

      if (!smaugUserId) {
        throw "Not authorized";
      }
      if (isCPRNumber(smaugUserId)) {
        throw "User not found in CULR";
      }
      const res = await context.datasources
        .getLoader("bibliotekDkOrders")
        .load({
          smaugUserId,
          limit,
          offset,
        });
      const orderIds = res?.result?.map((order) => order.orderId);
      if (orderIds.length > 0) {
        const result = await fetchOrderStatus({ orderIds: orderIds }, context);
        return { result, hitcount: res?.hitcount || 0 };
      }
      return { result: [], hitcount: 0 };
    },
    async address(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const homeAccount = getHomeAgencyAccount(userinfo);
      const res = await context.datasources.getLoader("user").load({
        homeAccount: homeAccount,
        accessToken: context.accessToken, // Required for testing
      });

      return res?.address;
    },
    async municipalityAgencyId(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      return userinfo?.attributes?.municipalityAgencyId;
    },
    async debt(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const userInfoAccounts = filterDuplicateAgencies(
        userinfo?.attributes?.agencies
      );
      return await context.datasources.getLoader("debt").load({
        userInfoAccounts: userInfoAccounts,
        accessToken: context.accessToken, // Required for testing
      });
    },
    async loans(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const userInfoAccounts = filterDuplicateAgencies(
        userinfo?.attributes?.agencies
      );
      return await context.datasources.getLoader("loans").load({
        userInfoAccounts: userInfoAccounts,
        accessToken: context.accessToken, // Required for testing
      });
    },
    async orders(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const userInfoAccounts = filterDuplicateAgencies(
        userinfo?.attributes?.agencies
      );
      return await context.datasources.getLoader("orders").load({
        userInfoAccounts: userInfoAccounts,
        accessToken: context.accessToken, // Required for testing
      });
    },
    async postalCode(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const homeAccount = getHomeAgencyAccount(userinfo);
      const res = await context.datasources.getLoader("user").load({
        homeAccount: homeAccount,
        accessToken: context.accessToken, // Required for testing
      });

      return res?.postalCode;
    },
    async mail(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const homeAccount = getHomeAgencyAccount(userinfo);
      const res = await context.datasources.getLoader("user").load({
        homeAccount: homeAccount,
        accessToken: context.accessToken, // Required for testing
      });

      return res?.mail;
    },
    async country(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const homeAccount = getHomeAgencyAccount(userinfo);
      const res = await context.datasources.getLoader("user").load({
        homeAccount: homeAccount,
        accessToken: context.accessToken, // Required for testing
      });

      return res?.country;
    },
    async culrMail(parent, args, context, info) {
      const resUserInfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const agencyWithEmail =
        resUserInfo.attributes &&
        resUserInfo.attributes.agencies &&
        resUserInfo.attributes.agencies.find((agency) =>
          isEmail(agency && agency.userId)
        );

      return agencyWithEmail && agencyWithEmail.userId;
    },
    async agency(parent, args, context, info) {
      /**
       * @TODO
       * Align agency and agencies properly
       * Discuss the intended usage of these fields
       */
      const userinfo = await context.datasources.getLoader("userinfo").load(
        {
          accessToken: context.accessToken,
        },
        context
      );
      const homeAgency = getHomeAgencyAccount(userinfo);

      return await context.datasources.getLoader("library").load({
        agencyid: homeAgency.agencyId,
        language: parent.language,
        limit: 100,
        status: args.status || "ALLE",
        bibdkExcludeBranches: args.bibdkExcludeBranches || false,
      });
    },
    async agencies(parent, args, context, info) {
      /**
       * @TODO
       * Align agency and agencies properly
       * Discuss the intended usage of these fields
       */
      const userinfo = await context.datasources.getLoader("userinfo").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      const agencies = filterDuplicateAgencies(
        userinfo?.attributes?.agencies
      )?.map((account) => account.agencyId);

      const agencyInfos = await Promise.all(
        agencies.map(
          async (agency) =>
            await context.datasources.getLoader("library").load({
              agencyid: agency,
              language: parent.language,
              limit: 20,
              status: args.status || "ALLE",
              bibdkExcludeBranches: args.bibdkExcludeBranches || false,
            })
        )
      );

      // Remove agencyes which doesnt exist in VIP
      // Example "190976" and "191977" (no VIP info) on testuser Michelle Hoffmann will return empty results
      const filteredAgencyInfoes = agencyInfos.filter(
        (agency) => agency?.result.length > 0
      );

      return filteredAgencyInfoes;
    },
  },
  Loan: {
    manifestation(parent, args, context, info) {
      return resolveManifestation({ faust: parent.titleId }, context);
    },
  },
  Order: {
    manifestation(parent, args, context, info) {
      return resolveManifestation({ faust: parent.titleId }, context);
    },
    async pickUpBranch(parent, args, context, info) {
      const libraries = await context.datasources.getLoader("library").load({
        branchId: parent.pickUpAgency?.replace(/\D/g, ""),
      });

      return libraries?.result?.[0];
    },
    status(parent, args, context, info) {
      // Map status to enum
      // https://openuserstatus.addi.dk/2.0/openuserstatus.xsd#orderStatusType
      return (
        {
          Active: "ACTIVE",
          "In process": "IN_PROCESS",
          "Available for pickup": "AVAILABLE_FOR_PICKUP",
          Expired: "EXPIRED",
          "Requested via ill": "REQUESTED_VIA_ILL",
          "At reservation shelf": "AT_RESERVATION_SHELF",
        }[parent.status] || "UNKNOWN"
      );
    },
  },
  Mutation: {
    async addUserToUserDataService(parent, args, context, info) {
      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }
        await context.datasources.getLoader("userDataCreateUser").load({
          smaugUserId: smaugUserId,
        });
        return { success: true };
      } catch (error) {
        log.error(
          `Failed to add user to userData service. Message: ${error.message}`
        );

        return { success: false, errorMessage: error?.message };
      }
    },
    async deleteUserFromUserDataService(parent, args, context, info) {
      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }

        await context.datasources.getLoader("userDataDeleteUser").load({
          smaugUserId: smaugUserId,
        });
        return { success: true };
      } catch (error) {
        return { success: false, errorMessage: error?.message };
      }
    },

    async setFavoritePickUpBranch(parent, args, context, info) {
      try {
        const { favoritePickUpBranch } = args;
        const smaugUserId = context?.smaug?.user?.uniqueId;

        if (!smaugUserId) {
          throw "Not authorized";
        }
        if (isCPRNumber(smaugUserId)) {
          throw "User not found in CULR";
        }

        //validate that favoritePickUpBranch is a valid user branch id
        const userBranchIds = await getUserBranchIds(context);
        if (!userBranchIds?.includes(favoritePickUpBranch)) {
          throw new Error("Invalid branch id.");
        }
        await context.datasources
          .getLoader("userDataFavoritePickupBranch")
          .load(
            {
              smaugUserId: smaugUserId,
              favoritePickUpBranch: favoritePickUpBranch,
            },
            context
          );
        return { success: true };
      } catch (error) {
        return { success: false, errorMessage: error?.message };
      }
    },
    async clearFavoritePickUpBranch(parent, args, context, info) {
      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }
        if (isCPRNumber(smaugUserId)) {
          throw "User not found in CULR";
        }
        await context.datasources
          .getLoader("userDataFavoritePickupBranch")
          .load({
            smaugUserId: smaugUserId,
            favoritePickUpBranch: null,
          });
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    },

    async addOrderToUserData(parent, args, context, info) {
      try {
        const { orderId } = args;

        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }
        if (isCPRNumber(smaugUserId)) {
          throw "User not found in CULR";
        }
        await context.datasources.getLoader("userDataAddOrder").load({
          smaugUserId: smaugUserId,
          orderId: orderId,
        });
        return { success: true };
      } catch (error) {
        return { success: false, errorMessage: error?.message };
      }
    },

    async deleteOrderFromUserData(parent, args, context, info) {
      try {
        const { orderId } = args;

        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }
        if (isCPRNumber(smaugUserId)) {
          throw "User not found in CULR";
        }
        const res = await context.datasources
          .getLoader("userDataRemoveOrder")
          .load({
            smaugUserId: smaugUserId,
            orderId: orderId,
          });

        return { success: !res?.error, errorMessage: res?.error };
      } catch (error) {
        return { success: false };
      }
    },
    async setPersistUserDataValue(parent, args, context, info) {
      try {
        const { persistUserData } = args;

        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw new Error("Not authorized");
        }
        if (isCPRNumber(smaugUserId)) {
          throw new Error("User not found in CULR");
        }

        const res = await context.datasources
          .getLoader("userDataDataConsent")
          .load({
            smaugUserId: smaugUserId,
            persistUserData: persistUserData,
          });

        return { success: !res?.error, errorMessage: res?.error };
      } catch (error) {
        return { success: false, errorMessage: error?.message };
      }
    },
  },
};
