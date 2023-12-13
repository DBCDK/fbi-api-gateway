/**
 * @file Profile type definition and resolvers
 *
 */

import {
  fetchOrderStatus,
  filterDuplicateAgencies,
  getUserBranchIds,
  resolveManifestation,
  isCPRNumber,
} from "../utils/utils";

import { filterAgenciesByProps } from "../utils/accounts";

import { hasInfomediaAccess } from "../utils/access";

import { isValidCpr } from "../utils/cpr";
import { log } from "dbc-node-logger";
import { deleteFFUAccount } from "../utils/agency";

/**
 * The Profile type definition
 */
export const typeDef = `
type User {
  name: String
  favoritePickUpBranch: String
  """
  Creation date in userdata service. Returns a timestamp with ISO 8601 format and in Coordinated Universal Time (UTC)
  """  
  createdAt: DateTime
  """
  We are allowed to store userdata for more than 30 days if set to true.
  """
  persistUserData: Boolean
  """
  Orders made through bibliotek.dk
  """
  bibliotekDkOrders(offset: Int limit: PaginationLimit): BibliotekDkOrders!
  agencies(language: LanguageCode): [BranchResult!]!
  loggedInBranchId: String @deprecated(reason: "Use 'User.loggedInAgencyId' instead")
  loggedInAgencyId: String
  municipalityNumber: String
  municipalityAgencyId: String
  address: String
  postalCode: String
  mail: String
  culrMail: String
  country: String
  orders: [Order!]! @complexity(value: 5)
  loans: [Loan!]! @complexity(value: 5)
  debt: [Debt!]! @complexity(value: 3)
  bookmarks(orderBy:BookMarkOrderBy): BookMarkResponse!
  rights: UserSubscriptions!
  isCPRValidated: Boolean!
  identityProviderUsed: String!
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
enum BookMarkOrderBy{
  createdAt
  title
}
type BookMark{
  materialType: String!
  materialId: String!
  bookmarkId: Int
  createdAt: DateTime
  workId: String
}

type BookmarkResponse {
  bookmarksAdded: [BookMark]
  bookmarksAlreadyExists: [BookMark]
}

input BookMarkInput {
  materialType: String!
  materialId: String!
  title: String!
  workId: String
}

type BookMarkDeleteResponse {
  IdsDeletedCount: Int!
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
  deleteBookmarks(bookmarkIds: [Int!]!): BookMarkDeleteResponse
  }
  
extend type Mutation {
  users: UserMutations!
}

extend type Query {
  user: User
}
`;

function isEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

/**
 * Validates uniqueId
 * @param {string} uniqueId
 */
function validateUserId(uniqueId) {
  if (!uniqueId) {
    throw "Not authorized";
  }
  if (isCPRNumber(uniqueId)) {
    throw "User not found in CULR";
  }
}

/**
 * Resolvers for the Profile type
 */
export const resolvers = {
  Query: {
    async user(parent, args, context, info) {
      if (!context.user) {
        return null;
      }

      return {};
    },
  },

  User: {
    async identityProviderUsed(parent, args, context, info) {
      return context?.user?.idpUsed;
    },
    async isCPRValidated(parent, args, context, info) {
      const user = context?.user;

      // Check if login provider is 'nemlogin'
      if (user.idpUsed === "nemlogin") {
        return true;
      }

      // Check if user has a CPR validated account
      const accounts = user?.agencies;
      return !!accounts?.find(
        (a) => a.userIdType === "CPR" && isValidCpr(a.userId)
      );
    },
    async rights(parent, args, context, info) {
      const user = context?.user;

      // rights default to false
      let subscriptions = {
        infomedia: false,
        digitalArticleService: false,
        demandDrivenAcquisition: false,
      };

      if (await hasInfomediaAccess(context)) {
        subscriptions.infomedia = true;
      }

      const municipalityAgencyId = user?.municipalityAgencyId;

      // Verify that the user has an account at the municiaplityAgencyId (created as loaner)
      const account = filterAgenciesByProps(user.agencies, {
        agency: municipalityAgencyId,
      })?.[0];

      // check for digital article service
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");

      // check with municipality agency
      if (digitalAccessSubscriptions[municipalityAgencyId]) {
        // User is loaner at municipalityAgencyId
        subscriptions.digitalArticleService = !!account;
      }

      // and now for DDA .. the only check we can do is if agency (municipality) starts with '7' (public library)
      if (municipalityAgencyId && municipalityAgencyId?.startsWith("7")) {
        subscriptions.demandDrivenAcquisition = !!account;
      }

      return subscriptions;
    },
    async name(parent, args, context, info) {
      const user = context?.user;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      const res = await context.datasources.getLoader("user").load({
        userId: account?.userId || user?.userId,
        agencyId: account?.agencyId || user?.loggedInAgencyId,
        accessToken: context.accessToken,
      });

      return res?.name;
    },

    async favoritePickUpBranch(parent, args, context, info) {
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        const res = await context.datasources
          .getLoader("userDataGetUser")
          .load({ uniqueId });
        return res?.favoritePickUpBranch || null;
      } catch (error) {
        return null;
      }
    },

    async createdAt(parent, args, context, info) {
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        const res = await context.datasources
          .getLoader("userDataGetUser")
          .load({ uniqueId });
        return res?.createdAt || null;
      } catch (error) {
        return null;
      }
    },

    async persistUserData(parent, args, context, info) {
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        const res = await context.datasources
          .getLoader("userDataGetUser")
          .load({ uniqueId });

        return res?.persistUserData;
      } catch (error) {
        return null;
      }
    },

    async bibliotekDkOrders(parent, args, context, info) {
      const user = context?.user;

      const { limit, offset } = args;
      const uniqueId = user?.uniqueId;

      validateUserId(uniqueId);

      const res = await context.datasources
        .getLoader("bibliotekDkOrders")
        .load({
          uniqueId,
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
      const user = context?.user;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      const res = await context.datasources.getLoader("user").load({
        userId: account?.userId || user?.userId,
        agencyId: account?.agencyId || user?.loggedInAgencyId,
        accessToken: context.accessToken,
      });

      return res?.address;
    },
    async municipalityNumber(parent, args, context, info) {
      const user = context?.user;

      return user?.municipality;
    },
    async municipalityAgencyId(parent, args, context, info) {
      const user = context?.user;

      return user?.municipalityAgencyId;
    },
    async debt(parent, args, context, info) {
      const user = context?.user;

      const userInfoAccounts = filterDuplicateAgencies(user?.agencies);
      return await context.datasources.getLoader("debt").load({
        userInfoAccounts: userInfoAccounts,
        accessToken: context.accessToken, // Required for testing
      });
    },
    async loans(parent, args, context, info) {
      const user = context?.user;

      const userInfoAccounts = filterDuplicateAgencies(user?.agencies);
      return await context.datasources.getLoader("loans").load({
        userInfoAccounts: userInfoAccounts,
        accessToken: context.accessToken, // Required for testing
      });
    },
    async orders(parent, args, context, info) {
      const user = context?.user;

      const userInfoAccounts = filterDuplicateAgencies(user?.agencies);
      return await context.datasources.getLoader("orders").load({
        userInfoAccounts: userInfoAccounts,
        accessToken: context.accessToken, // Required for testing
      });
    },
    async postalCode(parent, args, context, info) {
      const user = context?.user;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      const res = await context.datasources.getLoader("user").load({
        userId: account?.userId || user?.userId,
        agencyId: account?.agencyId || user?.loggedInAgencyId,
        accessToken: context.accessToken,
      });

      return res?.postalCode;
    },
    async mail(parent, args, context, info) {
      const user = context?.user;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      const res = await context.datasources.getLoader("user").load({
        userId: account?.userId || user?.userId,
        agencyId: account?.agencyId || user?.loggedInAgencyId,
        accessToken: context.accessToken,
      });

      return res?.mail;
    },
    async country(parent, args, context, info) {
      const user = context?.user;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      const res = await context.datasources.getLoader("user").load({
        userId: account.userId || user.userId,
        agencyId: account.agencyId || user.loggedInAgencyId,
        accessToken: context.accessToken,
      });

      return res?.country;
    },
    async culrMail(parent, args, context, info) {
      const user = context?.user;

      const agencyWithEmail = user?.agencies?.find((agency) =>
        isEmail(agency?.userId)
      );
      return agencyWithEmail?.userId;
    },
    async loggedInBranchId(parent, args, context, info) {
      const user = context?.user;

      return user.loggedInAgencyId;
    },
    async loggedInAgencyId(parent, args, context, info) {
      const user = context?.user;

      return user.loggedInAgencyId;
    },
    async agencies(parent, args, context, info) {
      const user = context?.user;

      const agencies = filterDuplicateAgencies(user?.agencies)?.map(
        (account) => account.agencyId
      );

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

      // Filter deleted branches
      const filteredNonActiveBranches = filteredAgencyInfoes.map((i) => {
        return {
          ...i,
          result: i.result.filter((branch) => {
            return branch.status === "active";
          }),
        };
      });

      const sortedAgencies = filteredNonActiveBranches.sort((a, b) =>
        a.result[0].agencyName.localeCompare(b.result[0].agencyName)
      );

      const loginAgencyIdx = sortedAgencies.findIndex((agency) => {
        const matchingBranch =
          agency.result.findIndex(
            (library) => library.branchId === user?.loggedInAgencyId
          ) > -1;
        return (
          agency.result[0].agencyId === user?.loggedInAgencyId || matchingBranch
        );
      });

      //put element at loginAgencyIdx at the beginning of the array
      if (loginAgencyIdx > 0) {
        const loginAgency = sortedAgencies.splice(loginAgencyIdx, 1)[0];
        filteredAgencyInfoes.unshift(loginAgency);
      }
      return sortedAgencies;
    },
    async bookmarks(parent, args, context, info) {
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        const { orderBy } = args;

        const res = await context.datasources
          .getLoader("userDataGetBookMarks")
          .load({ uniqueId, orderBy });

        return { result: res?.result, hitcount: res?.result?.length || 0 };
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
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;
        if (!uniqueId) {
          throw "Not authorized";
        }
        await context.datasources.getLoader("userDataCreateUser").load({
          uniqueId,
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
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;
        if (!uniqueId) {
          throw "Not authorized";
        }

        // Check if user has a CPR validated account
        const accounts = user?.agencies;

        //find all FFU libraries
        const ffuLibraries = accounts?.filter(
          (account) => account?.agencyId[0] === "8"
        );
        //delete all ffuLibraries
        const deleteRequests = ffuLibraries.map((ffLibrary) => {
          return deleteFFUAccount({
            agencyId: ffLibrary.agencyId,
            context,
          });
        });
        let responses = await Promise.all(deleteRequests);
        //check that all deletion request are successfull
        const deletedAllFFuLibraries = responses.every(
          (obj) => obj.status === "OK"
        );

        //throw error if not all FFu libraries are deleted
        if (!deletedAllFFuLibraries) {
          throw new Error("Could not delete all FFU libraries");
        }
        //delete user data from userData service (bookmarks, orderhistory etc.)
        await context.datasources.getLoader("userDataDeleteUser").load({
          uniqueId,
        });
        return { success: true };
      } catch (error) {
        return { success: false, errorMessage: error?.message };
      }
    },
    async setFavoritePickUpBranch(parent, args, context, info) {
      const user = context?.user;

      try {
        const { favoritePickUpBranch } = args;
        const uniqueId = user?.uniqueId;

        validateUserId(uniqueId);

        //validate that favoritePickUpBranch is a valid user branch id
        const userBranchIds = await getUserBranchIds(context);
        if (!userBranchIds?.includes(favoritePickUpBranch)) {
          throw new Error("Invalid branch id.");
        }
        await context.datasources
          .getLoader("userDataFavoritePickupBranch")
          .load({ uniqueId, favoritePickUpBranch }, context);
        return { success: true };
      } catch (error) {
        return { success: false, errorMessage: error?.message };
      }
    },
    async clearFavoritePickUpBranch(parent, args, context, info) {
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        await context.datasources
          .getLoader("userDataFavoritePickupBranch")
          .load({ uniqueId, favoritePickUpBranch: null });
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    },
    async addOrderToUserData(parent, args, context, info) {
      const user = context?.user;

      try {
        const { orderId } = args;

        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        await context.datasources
          .getLoader("userDataAddOrder")
          .load({ uniqueId, orderId });
        return { success: true };
      } catch (error) {
        return { success: false, errorMessage: error?.message };
      }
    },
    async deleteOrderFromUserData(parent, args, context, info) {
      const user = context?.user;

      try {
        const { orderId } = args;

        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        const res = await context.datasources
          .getLoader("userDataRemoveOrder")
          .load({ uniqueId, orderId });

        return { success: !res?.error, errorMessage: res?.error };
      } catch (error) {
        return { success: false };
      }
    },
    async setPersistUserDataValue(parent, args, context, info) {
      const user = context?.user;

      try {
        const { persistUserData } = args;
        const uniqueId = user?.uniqueId;

        if (!uniqueId) {
          throw new Error("Not authorized");
        }
        if (isCPRNumber(uniqueId)) {
          throw new Error("User not found in CULR");
        }

        const res = await context.datasources
          .getLoader("userDataDataConsent")
          .load({ uniqueId, persistUserData });

        return { success: !res?.error, errorMessage: res?.error };
      } catch (error) {
        return { success: false, errorMessage: error?.message };
      }
    },
    async addBookmarks(parent, args, context, info) {
      const user = context?.user;

      /**
       * Handles single or multiple additions to bookmarks.
       *
       * @param {uniqueId: string, bookmarks: [{materialType, string, materialId: string, title: string, workId?: string}]}
       *
       * We espect multiple additions to ignore already set bookmarks (since it's used for syncronizing cookie bookmarks with the user database),
       * while we espect single additions to throw an error if this bookmark already exists
       */

      try {
        const uniqueId = user?.uniqueId;

        if (!uniqueId) {
          throw new Error("Not authorized");
        }
        if (isCPRNumber(uniqueId)) {
          throw new Error("User not found in CULR");
        }

        if (!args.bookmarks || args.bookmarks.length === 0) {
          throw new Error("Bookmarks not set");
        }

        const res = await context.datasources
          .getLoader("userDataAddBookmarks")
          .load({
            uniqueId,
            bookmarks: args.bookmarks.map((bookmark) => {
              return {
                workId: bookmark.workId,
                materialType: bookmark.materialType,
                materialId: bookmark.materialId,
                title: bookmark.title,
              };
            }),
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
    async deleteBookmarks(parent, args, context, info) {
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;

        if (!uniqueId) {
          throw new Error("Not authorized");
        }
        if (isCPRNumber(uniqueId)) {
          throw new Error("User not found in CULR");
        }

        const res = await context.datasources
          .getLoader("userDataDeleteBookmark")
          .load({ uniqueId, bookmarkIds: args.bookmarkIds });

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
