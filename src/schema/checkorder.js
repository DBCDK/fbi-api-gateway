export const typeDef = `
   type CheckOrderPolicy {
    lookUpUrl: String
    orderPossible: Boolean
    orderPossibleReason: String
   }`;

/*
@TODO
ENUM from
<xs:enumeration value="owned_accepted"/>
<xs:enumeration value="not_owned_ILL_loc"/>
<xs:enumeration value="owned_wrong_mediumType"/>
<xs:enumeration value="not_owned_wrong_ILL_mediumType"/>
<xs:enumeration value="not_owned_no_ILL_loc"/>
<xs:enumeration value="owned_own_catalogue"/>
<xs:enumeration value="not_owned_accepted_by_consortia"/>
 */

export const resolvers = {
  CheckOrderPolicy: {
    lookUpUrl(parent, args, context, info) {
      return parent.lookUpUrl;
    },
    orderPossible(parent, args, context, info) {
      return parent.orderPossible;
    },
    orderPossibleReason(parent, args, context, info) {
      return parent.orderPossibleReason;
    },
  },
};
