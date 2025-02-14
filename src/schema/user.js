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
  resolveWork,
} from "../utils/utils";

import { filterAgenciesByProps } from "../utils/accounts";

import { hasInfomediaAccess } from "../utils/access";

import { isValidCpr } from "../utils/cpr";
import { log } from "dbc-node-logger";
import { deleteFFUAccount } from "./bibdk/culr";
import { getUserFromAllUserStatusData, hasCulrDataSync } from "../utils/agency";

/**
 * The Profile type definition
 */
export const typeDef = `
type User {
  name: String
  favoritePickUpBranch: String
  """
  Last used pickup branch. Updated each time the user makes an order.
  """  
  lastUsedPickUpBranch: String

  """
  Creation date in userdata service. Returns a timestamp with ISO 8601 format and in Coordinated Universal Time (UTC)
  """  
  createdAt: DateTimeScalar
  """
  We are allowed to store userdata for more than 30 days if set to true.
  """
  persistUserData: Boolean
  """
  Orders made through bibliotek.dk
  """
  bibliotekDkOrders(offset: Int limit: PaginationLimitScalar): BibliotekDkOrders!
  """
  Saved searches from complex search
  """
  savedSearches(offset: Int limit: PaginationLimitScalar): SavedSearchResponse!
  """
  Get one saved search by cql. Returns searchobject including id.
  """
  savedSearchByCql(cql: String!): SavedSearch

  
  agencies(language: LanguageCodeEnum): [Agency!]!
  loggedInBranchId: String
  loggedInAgencyId: String
  municipalityNumber: String
  municipalityAgencyId: String
  address: String
  postalCode: String
  mail: String
  culrMail: String
  country: String
  orders: [Order!]! @complexity(value: 5)
  loans: BibdkLoans @complexity(value: 5)
  debt: [Debt!]! @complexity(value: 3)
  bookmarks(orderBy:BookMarkOrderByEnum): BookMarkResponse!
  rights: UserSubscriptions!
  isCPRValidated: Boolean!
  identityProviderUsed: String!
  hasCulrUniqueId: Boolean!
  omittedCulrData: OmittedCulrDataResponse
}

type SavedSearchResponse {
  result: [SavedSearch!]
  hitcount: Int!
  }

type SavedSearch {
  """
  SearchObject including fieldSearch, facetts, quickfilter etc. 
  """
  searchObject: String
  """
  Unique id for the search. Use this id to delete a search.
  """
  id: Int
  """
  Creation timestamps
  """
  createdAt: DateTimeScalar
  """
  cql including fieldSearch, facetts, quickfilter etc. 
  """
  cql: String

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
result: [BibliotekDkOrder!]
hitcount: Int!
}
type BibliotekDkOrder  {

  """
  Unique id for the order
  """
  orderId: String

  """
  Work data for the given order
  """
  work: Work

  """
  Date and time when the order was created
  """
  creationDate: String
}

enum RequestStatusEnum {
  UND_ERR_HEADERS_TIMEOUT
  OK
}

type BibdkLoans {
  status: Boolean!
  statusCode: RequestStatusEnum
  Loans: [Loan!]!
}

type Loan {
  dueDate:	DateTimeScalar!
  loanId:	String!
  agencyId: String!
  creator: String
  title: String
  edition: String
  pages: String
  publisher: String
  language: String
  manifestation: Manifestation
  materialType: String
}
enum OrderStatusEnum {
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
  status: OrderStatusEnum!
  pickUpBranch: Branch!
  agencyId: String!
  holdQueuePosition: String
  orderDate: DateTimeScalar!
  creator: String
  title: String
  pickUpExpiryDate: DateTimeScalar
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
  date: DateTimeScalar
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
enum BookMarkOrderByEnum {
  CREATEDAT
  TITLE
}
type BookMark{
  materialType: String!
  materialId: String!
  bookmarkId: Int
  createdAt: DateTimeScalar
  workId: String
  agencyId: String
}

type AddBookMarkResponse {
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

type SavedSearchDeleteResponse {
  idsDeletedCount: Int!
  message: String
}
type SavedSearchUpdateResponse {
  message: String
}

type OmittedCulrDataResponse {
  hasOmittedCulrUniqueId: Boolean!
  hasOmittedCulrMunicipality: Boolean!
  hasOmittedCulrMunicipalityAgencyId: Boolean!
  hasOmittedCulrAccounts: Boolean!
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
  addBookmarks(bookmarks: [BookMarkInput!]!): AddBookMarkResponse
  """
  Delete a bookmark
  """
  deleteBookmarks(bookmarkIds: [Int!]!): BookMarkDeleteResponse
  """
  Add a saved search
  """
  addSavedSearch(searchObject: String!): SavedSearch
  """
  Update one savedSearch
  """
  updateSavedSearch(savedSearchId: Int!,searchObject: String!): SavedSearchUpdateResponse
  """
  Delete one or more saved searches
  """
  deleteSavedSearches(savedSearchIds: [Int!]!): SavedSearchDeleteResponse
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
    async hasCulrUniqueId(parent, args, context, info) {
      return !!context?.user?.uniqueId;
    },
    async omittedCulrData(parent, args, context, info) {
      const loggedInAgencyId = context?.user?.loggedInAgencyId;
      if (await hasCulrDataSync(loggedInAgencyId, context)) {
        return null;
      }

      return context?.user?.omittedCulrData;
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

      // Select first CPR account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      let res = await context.datasources.getLoader("user").load({
        userId: account?.userId,
        agencyId: account?.agencyId,
      });

      if (!res?.name) {
        // If no data was found backfill from users other accounts
        res = await getUserFromAllUserStatusData({}, context);
      }

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
    async lastUsedPickUpBranch(parent, args, context, info) {
      const user = context?.user;

      try {
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        const res = await context.datasources
          .getLoader("userDataGetUser")
          .load({ uniqueId });
        return res?.lastUsedPickUpBranch || null;
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

      const workresult = await Promise.all(
        res?.result?.map(async (order) => {
          let orsResult = {};
          if (order.orderId) {
            //TODO: remove fetchOrderStatus call once frontend is updated to use titles and creators instead of titile and author.
            const orsResponse = await fetchOrderStatus(
              { orderIds: [order.orderId] },
              context
            );
            orsResult = orsResponse?.[0];
          }

          const workData = await resolveWork({ pid: order.pid }, context);
          const creators = [
            ...workData?.creators?.persons?.map((person) => ({
              ...person,
              __typename: "Person",
            })),
            ...workData?.creators?.corporations?.map((person) => ({
              ...person,
              __typename: "Corporation",
            })),
          ];
          const work = { ...workData, creators };
          return {
            work,
            creationDate: order.createdAt,
            ...orsResult,
          };
        })
      );

      return { result: workresult, hitcount: res?.hitcount || 0 };
    },
    async address(parent, args, context, info) {
      const user = context?.user;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      let res = await context.datasources.getLoader("user").load({
        userId: account?.userId,
        agencyId: account?.agencyId,
      });

      if (!res?.address) {
        // If no data was found backfill from users other accounts
        res = await getUserFromAllUserStatusData({}, context);
      }

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

      let res = await context.datasources.getLoader("user").load({
        userId: account?.userId,
        agencyId: account?.agencyId,
      });

      if (!res?.postalCode) {
        // If no data was found backfill from users other accounts
        res = await getUserFromAllUserStatusData({}, context);
      }

      return res?.postalCode;
    },
    async mail(parent, args, context, info) {
      const user = context?.user;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      let res = await context.datasources.getLoader("user").load({
        userId: account?.userId,
        agencyId: account?.agencyId,
      });

      if (!res?.mail) {
        // If no data was found backfill from users other accounts
        res = await getUserFromAllUserStatusData({}, context);
      }

      return res?.mail;
    },
    async country(parent, args, context, info) {
      const user = context?.user;

      // select cpr account from user agencies
      const account = filterAgenciesByProps(user.agencies, {
        type: "CPR",
      })?.[0];

      let res = await context.datasources.getLoader("user").load({
        userId: account?.userId,
        agencyId: account?.agencyId,
      });

      if (!res?.country) {
        // If no data was found backfill from users other accounts
        res = await getUserFromAllUserStatusData({}, context);
      }

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
      return user.loggedInBranchId;
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

      const language = args.language?.toLowerCase() || "da";

      let agencyInfos = await Promise.all(
        agencies.map(async (agencyid) => {
          const options = {
            language,
            limit: 30,
            status: "AKTIVE",
            bibdkExcludeBranches: false,
          };
          let agency = await context.datasources.getLoader("library").load({
            agencyid,
            ...options,
          });
          if (!agency?.result?.length) {
            // For some FFU's the agencyId is actually a branchId
            // Hence we try to fetch the agency by branchId
            agency = await context.datasources.getLoader("library").load({
              branchId: agencyid,
              ...options,
            });

            if (agency?.result?.[0]) {
              // This branch should be considered as independent agency
              agency.result = [{ ...agency.result[0], agencyId: agencyid }];
            }
          }
          return agency;
        })
      );

      // Remove agencies that dont exist in VIP
      // Example "190976" and "191977" (no VIP info) on testuser Michelle Hoffmann will return empty results
      const filteredAgencyInfoes = agencyInfos.filter(
        (agency) => agency?.result.length > 0
      );

      const sortedAgencies = filteredAgencyInfoes?.sort((a, b) =>
        a?.result?.[0]?.agencyName?.localeCompare(b?.result?.[0]?.agencyName)
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
        // filter by agencyId to seperate studiesøg and bibliotek.dk bookmarks
        const agencyId = context.profile.agency;
        const res = await context.datasources
          .getLoader("userDataGetBookMarks")
          .load({ uniqueId, orderBy, agencyId });

        return { result: res?.result, hitcount: res?.result?.length || 0 };
      } catch (error) {
        log.error(
          `Failed to get bookmarks from userData service. Message: ${error.message}`
        );
        return [];
      }
    },
    async savedSearches(parent, args, context, info) {
      const user = context?.user;

      const { limit, offset } = args;
      const uniqueId = user?.uniqueId;
      validateUserId(uniqueId);

      const res = await context.datasources
        .getLoader("userDataGetSavedSearches")
        .load({
          uniqueId,
          limit,
          offset,
        });

      return { result: res?.result || [], hitcount: res?.hitcount || 0 };
    },
    async savedSearchByCql(parent, args, context, info) {
      const user = context?.user;
      const cql = args.cql;

      const uniqueId = user?.uniqueId;
      validateUserId(uniqueId);

      const res = await context.datasources
        .getLoader("userDataGetSavedSearchByCql")
        .load({
          uniqueId,
          cql,
        });
      return res;
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
        //profile agency id. Used to filter studiesøg bookmarks
        const agencyId = context.profile.agency;

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
                agencyId: agencyId,
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

    async addSavedSearch(parent, args, context, info) {
      const user = context?.user;

      try {
        const { searchObject } = args;
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);
        const res = await context.datasources
          .getLoader("userDataAddSavedSearch")
          .load({ uniqueId, searchObject });
        return res;
      } catch (error) {
        return { message: "Error. Could not delete saved searches" };
      }
    },
    async updateSavedSearch(parent, args, context, info) {
      const user = context?.user;

      try {
        const { searchObject, savedSearchId } = args;
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        const res = await context.datasources
          .getLoader("userDataUpdateSavedSearch")
          .load({ uniqueId, savedSearchId, searchObject });
        return res;
      } catch (error) {
        return { message: "Error. Could not delete saved searches" };
      }
    },
    async deleteSavedSearches(parent, args, context, info) {
      const user = context?.user;

      try {
        const { savedSearchIds } = args;
        const uniqueId = user?.uniqueId;
        validateUserId(uniqueId);

        const res = await context.datasources
          .getLoader("userDataDeleteSavedSearches")
          .load({ uniqueId, savedSearchIds });
        return { message: res.message, idsDeletedCount: res?.count || 0 };
      } catch (error) {
        return { message: "Error. Could not delete saved searches" };
      }
    },
  },
};
