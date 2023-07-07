export const typeDef = `
  type RenewLoanResponse {

    """
    Whether the order was deleted or not.
    """
    renewed: Boolean!

    """
    Error message
    """
    error: String
  }
`;
