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
import getUserCanBorrowStatus from "../utils/getUserCanBorrowStatus";

/**
 * The Profile type definition
 */
export const typeDef = `
type User {
  name: String
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
  loggedInBranchId: String
  municipalityAgencyId: String
  address: String
  postalCode: String
  mail: String
  culrMail: String
  country: String
  orders: [Order!]! @complexity(value: 5)
  loans: [Loan!]! @complexity(value: 5)
  debt: [Debt!]! @complexity(value: 3)
  bookmarks(offset: Int, limit: PaginationLimit): BookMarkResponse!
  rights: UserSubscriptions!
}

type UserSubscriptions {
  infomedia: Boolean!,
  digitalArticleService: Boolean!,
  demandDrivenAcquisition: Boolean!
}
"""
Response object for bookmark request
"""
type BookMarkResponse {
result: [BookMark!]!
hitcount: Int!
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

type BookMarkId {
  bookMarkId: Int!
}

type BookMark{
  materialType: String!
  materialId: String!
  bookmarkId: Int
  createdAt: DateTime
}

type BookmarkResponse {
  bookmarksAdded: [BookMark]
  bookmarksAlreadyExists: [BookMark]
}

input BookMarkInput {
  materialType: String!
  materialId: String!
}

type UserMutations {
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
  
  """
  Add a bookmark
  """
  addBookmarks(bookmarks: [BookMarkInput!]!): BookmarkResponse
  """
  Delete a bookmark
  """
  deleteBookmark(bookmarkId: Int!): Int!
  }
  
extend type Mutation {
  users:UserMutations!
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
    async rights(parent, args, context, info) {
      let subscriptions = {
        infomedia: false,
        digitalArticleService: false,
        demandDrivenAcquisition: false,
      };

      // get municipality agency
      const municipalityAgencyId = await this.municipalityAgencyId(
        parent,
        args,
        context,
        info
      );

      //const userAgencies = await this.agencies(parent, args, context, info);
      // get rights from idp
      const idpRights = await context.datasources.getLoader("idp").load("");

      // check for infomedia access - if either of users agencies subscribes
      /** NOTE  we leave this (outcommented) for loop for now @TODO is it correct  ?? **/
      //for (const agency of userAgencies?.[0]?.result) {
      if (municipalityAgencyId && idpRights[municipalityAgencyId]) {
        subscriptions.infomedia = true;
        //   break;
      }
      //}
      // check for digital article service
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");

      // check with municipality agency
      if (digitalAccessSubscriptions[municipalityAgencyId]) {
        subscriptions.digitalArticleService = true;
      }

      // and now for DDA .. the only check we can do is if agency (municipality) starts with '7' (public library)
      if (municipalityAgencyId && municipalityAgencyId?.startsWith("7")) {
        subscriptions.demandDrivenAcquisition = true;
      }

      return subscriptions;
    },
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
    async loggedInBranchId(parent, args, context, info) {
      return context.smaug.user.agency;
    },
    async agencies(parent, args, context, info) {
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
              limit: 30,
              status: args.status || "ALLE",
              bibdkExcludeBranches: args.bibdkExcludeBranches || false,
            })
        )
      );

      // Remove agencies that dont exist in VIP
      // Example "190976" and "191977" (no VIP info) on testuser Michelle Hoffmann will return empty results
      const filteredAgencyInfoes = agencyInfos.filter(
        (agency) => agency?.result.length > 0
      );

      const sortedAgencies = filteredAgencyInfoes.sort((a, b) =>
        a.result[0].agencyName.localeCompare(b.result[0].agencyName)
      );

      const loginAgencyIdx = sortedAgencies.findIndex((agency) => {
        const matchingBranch =
          agency.result.findIndex(
            (library) => library.branchId === context.smaug.user.agency
          ) > -1;
        return (
          agency.result[0].agencyId === context.smaug.user.agency ||
          matchingBranch
        );
      });

      //put element at loginAgencyIdx at the beginning of the array
      if (loginAgencyIdx > 0) {
        const loginAgency = sortedAgencies.splice(loginAgencyIdx, 1)[0];
        filteredAgencyInfoes.unshift(loginAgency);
      }

      //check blocking status for each agency & if user exists on agency (FFU)
      const checkedAgency = sortedAgencies.map(async (agency) => {
        const { status, statusCode } = await getUserCanBorrowStatus(
          { agencyId: agency.result[0].agencyId },
          context
        );
        return {
          ...agency,
          canBorrow: {
            canBorrow: status,
            statusCode,
          },
        };
      });

      return checkedAgency;
    },
    async bookmarks(parent, args, context, info) {
      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }
        const { limit, offset } = args;

        const res = await context.datasources
          .getLoader("userDataGetBookMarks")
          .load({
            smaugUserId: smaugUserId,
            limit,
            offset,
          });

        return { result: res.result, hitcount: res?.hitcount || 0 };
      } catch (error) {
        log.error(
          `Failed to get bookmarks from userData service. Message: ${error.message}`
        );
        return [];
      }
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
    async users(parent, args, context, info) {
      return {};
    },
  },
  UserMutations: {
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
    async addBookmarks(parent, args, context, info) {
      /**
       * Handles single or multiple additions to bookmarks.
       *
       * For multiple, {smaugUserId: string, bookmarks: [{materialType, string, materialId: string}]}
       * For single, {smaugUserId: string, materialType, string, materialId: string}
       *
       * We espect multiple additions to ignore already set bookmarks (since it's used for syncronizing cookie bookmarks with the user database),
       * while we espect single additions to throw an error if this bookmark already exists
       */

      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;

        if (!smaugUserId) {
          throw new Error("Not authorized");
        }
        if (isCPRNumber(smaugUserId)) {
          throw new Error("User not found in CULR");
        }

        if (!args.bookmarks || args.bookmarks.length === 0) {
          throw new Error("Bookmarks not set");
        }

        const res = await context.datasources
          .getLoader("userDataAddBookmarks")
          .load({
            smaugUserId: smaugUserId,
            bookmarks: args.bookmarks.map((bookmark) => ({
              materialType: bookmark.materialType,
              materialId: bookmark.materialId,
            })),
          });

        return res;
      } catch (error) {
        // @TODO log
        log.error(
          `Failed to add bookmark to userData service. Message: ${error.message}`
        );
        return { bookMarkId: 0 };
      }
    },
    async deleteBookmark(parent, args, context, info) {
      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;

        if (!smaugUserId) {
          throw new Error("Not authorized");
        }
        if (isCPRNumber(smaugUserId)) {
          throw new Error("User not found in CULR");
        }

        const res = await context.datasources
          .getLoader("userDataDeleteBookmark")
          .load({
            smaugUserId: smaugUserId,
            bookmarkId: args.bookmarkId,
          });

        return res;
      } catch (error) {
        log.error(
          `Failed to delete bookmark in userData service. Message: ${error.message}`
        );
        return 0;
      }
    },
  },
};
