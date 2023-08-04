/*
TYPEDEF EXPLANATION
NOT_OWNED_ILL_LOC -> Other Agency owns material - order is possible (orderPossible="true")
OWNED_ACCEPTED -> item available at pickupAgency, order accepted (orderPossible="true")
OWNED_WRONG_MEDIUMTYPE -> item available at pickupAgency, order of mediumType not accepted (orderPossible="false")
NOT_OWNED_WRONG_ILL_MEDIUMTYPE -> item not available at pickupAgency, ILL of mediumType not accepted (orderPossible="false")
NOT_OWNED_NO_ILL_LOC -> item not available at pickupAgency, item not localised for ILL (orderPossible="false")
OWNED_OWN_CATALOGUE -> item available at pickupAgency, item may be ordered directly through the pickupAgency's catalogue (orderPossible="false")
NOT_OWNED_ACCEPTED_BY_CONSORTIA -> ???
 */

export const typeDef = `
    enum OrderPossibleReason {
      OWNED_ACCEPTED
      NOT_OWNED_ILL_LOC
      OWNED_WRONG_MEDIUMTYPE
      NOT_OWNED_WRONG_ILL_MEDIUMTYPE
      NOT_OWNED_NO_ILL_LOC
      OWNED_OWN_CATALOGUE
      NOT_OWNED_ACCEPTED_BY_CONSORTIA
    }
   type CheckOrderPolicy {
    lookUpUrl: String
    orderPossible: Boolean
    orderPossibleReason: OrderPossibleReason
   }`;

export const resolvers = {
  CheckOrderPolicy: {
    lookUpUrl(parent, args, context, info) {
      return parent.lookUpUrl?.[0] || null;
    },
    orderPossible(parent, args, context, info) {
      return parent.orderPossible;
    },
    orderPossibleReason(parent, args, context, info) {
      return {
        owned_accepted: "OWNED_ACCEPTED",
        not_owned_ILL_loc: "NOT_OWNED_ILL_LOC",
        owned_wrong_mediumType: "OWNED_WRONG_MEDIUMTYPE",
        not_owned_wrong_ILL_mediumType: "NOT_OWNED_WRONG_ILL_MEDIUMTYPE",
        not_owned_no_ILL_loc: "NOT_OWNED_NO_ILL_LOC",
        owned_own_catalogue: "OWNED_OWN_CATALOGUE",
        not_owned_accepted_by_consortia: "NOT_OWNED_ACCEPTED_BY_CONSORTIA",
      }[parent.orderPossibleReason];
    },
  },
};
