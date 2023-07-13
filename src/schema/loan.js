export const typeDef = `
  type RenewLoanResponse {

    """
    Whether the loan was renewed or not.
    """
    renewed: Boolean!

    """
    Error message
    """
    error: String
  }
`;
