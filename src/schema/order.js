/**
 * @file availability type definition and resolvers
 *
 */

export const typeDef = `
   type SubmitOrder {
    """
    if order was submitted successfully
    """
    ok: Boolean,
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
      userName: String,
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
    author: String
    authorOfComponent: String
    pagination: String
    publicationDate: String
    publicationDateOfComponent: String
    title: String
    titleOfComponent: String
    volume: String
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
    closed: Boolean!

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
    creationDate: String!
   }

  `;

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
