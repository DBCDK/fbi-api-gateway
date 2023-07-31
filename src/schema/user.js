/**
 * @file Profile type definition and resolvers
 *
 */

import { resolveManifestation } from "../utils/utils";

/**
 * The Profile type definition
 */
export const typeDef = `
type User {
  name: String!
  favoritePickUpBranch: String
  bibliotekDkOrders: [BibliotekDkOrders]
  address: String
  postalCode: String
  municipalityAgencyId: String
  mail: String
  culrMail: String
  agency(language: LanguageCode): BranchResult!
  orders: [Order!]!
  loans: [Loan!]!
  debt: [Debt!]!
}
"""
Orders made through bibliotek.dk
"""
type BibliotekDkOrders {
  createdAt: String
  orderId: String
}
type Loan {
  dueDate:	DateTime!
  loanId:	String!
  manifestation: Manifestation
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
  holdQueuePosition: String
  orderDate: DateTime!
  creator: String
  title: String
  pickUpExpiryDate: DateTime
  manifestation: Manifestation
}
type Debt {
  amount: String!
  creator: String
  currency: String
  date: DateTime
  title: String
}

type UserDataResponse {

  """
  Whether the opreation was sucess or not
  """
  success: Boolean!

}

type Mutation {
  """
  Add user to userdata service
  """
  addUserToUserDataService:UserDataResponse


"""
Delete user from userdata service
"""
deleteUserFromUserDataService:UserDataResponse

"""
Add an orderId to a user. Will create user in userdata service if they dont exist
"""
addOrder(orderId: String!):UserDataResponse
"""
Set a favorite pickup branch. Will create user in userdata service if they dont exist
"""
setFavoritePickUpBranch(favoritePickUpBranch: String!):UserDataResponse

"""
Sets favoritePickUpBranch to null
"""
clearFavoritePickUpBranch:UserDataResponse

}

`;

function isEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
/**
 * returns true if input has CPR-number format(10 digits)
 * @param {String} uniqueId
 * @returns {Boolean}
 */
function isCPRNumber(uniqueId) {
  return /^\d{10}$/.test(uniqueId);
}

function getUserId() {}
/**
 * Resolvers for the Profile type
 */
export const resolvers = {
  User: {
    async name(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });
      return res.name;
    },

    async favoritePickUpBranch(parent, args, context, info) {
      try {
        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId || isCPRNumber(smaugUserId)) {
          return null;
        }
        const res = await context.datasources
          .getLoader("userDataGetUser")
          .load({
            smaugUserId: smaugUserId,
          });
        return res.favoritePickUpBranch;
      } catch (error) {
        return null;
      }
    },

    async bibliotekDkOrders(parent, args, context, info) {
      const smaugUserId = context?.smaug?.user?.uniqueId;
      const res = await context.datasources.getLoader("userDataGetUser").load({
        smaugUserId: smaugUserId,
      });
      if (!smaugUserId || isCPRNumber(smaugUserId)) {
        return null;
      }
      return res.orders;
    },
    async address(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });
      return res.address;
    },
    async municipalityAgencyId(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      return userinfo?.attributes?.municipalityAgencyId;
    },
    async debt(parent, args, context, info) {
      const res = await context.datasources.getLoader("debt").load({
        accessToken: context.accessToken,
      });
      return res.debt;
    },
    async loans(parent, args, context, info) {
      const res = await context.datasources.getLoader("loans").load({
        accessToken: context.accessToken,
      });

      return res.loans;
    },
    async orders(parent, args, context, info) {
      const res = await context.datasources.getLoader("orders").load({
        accessToken: context.accessToken,
      });

      return res.orders;
    },
    async postalCode(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });

      return res.postalCode;
    },
    async mail(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });
      return res.mail;
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
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });

      return await context.datasources.getLoader("library").load({
        agencyid: res.agency,
        language: parent.language,
        limit: 100,
        status: args.status || "ALLE",
        bibdkExcludeBranches: args.bibdkExcludeBranches || false,
      });
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
        return { success: false };
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
        return { success: false };
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
        await context.datasources
          .getLoader("userDataFavoritePickupBranch")
          .load({
            smaugUserId: smaugUserId,
            favoritePickUpBranch: favoritePickUpBranch,
          });
        return { success: true };
      } catch (error) {
        return { success: false };
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

  
    async addOrder(parent, args, context, info) {
      try {
        const { orderId } = args;

        const smaugUserId = context?.smaug?.user?.uniqueId;
        if (!smaugUserId) {
          throw "Not authorized";
        }
        if (isCPRNumber(smaugUserId)) {
          throw "User not found in CULR";
        }

        // Get user info
        const userinfo = await context.datasources
          .getLoader("userDataAddOrder")
          .load({
            smaugUserId: smaugUserId,
            orderId: orderId,
          });
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    },
  },
};
