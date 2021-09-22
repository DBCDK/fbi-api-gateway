/**
 * @file availability type definition and resolvers
 *
 */

export const typeDef = `
   type SubmitOrder {
    status: String,
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
      userName: String!,
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
  } `;

/**
 * Resolvers for the Profile type
 */
export const resolvers = {
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
