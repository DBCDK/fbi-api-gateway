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
     OWNED_WRONG_MEDIUM_TYPE
     NOT_OWNED_WRONG_ILL_MEDIUMTYPE
     NOT_OWNED_WRONG_ILL_MEDIUM_TYPE
     NOT_OWNED_NO_ILL_LOC
     OWNED_OWN_CATALOGUE
     NOT_OWNED_ACCEPTED_BY_CONSORTIA
   }
   type CheckOrderPolicy {
    lookUpUrls: [String!]!
    lookUpUrl: String
    orderPossible: Boolean
    orderPossibleReason: OrderPossibleReason
   }`;

export const resolvers = {
  CheckOrderPolicy: {
    lookUpUrls(parent, args, context, info) {
      return (
        parent.lookUpUrl?.map((singleLookUpUrl) => singleLookUpUrl.value) || []
      );
    },
    lookUpUrl(parent, args, context, info) {
      return parent.lookUpUrl?.[0]?.value || null;
    },
    orderPossible(parent, args, context, info) {
      return parent.orderPossible;
    },
  },
};
