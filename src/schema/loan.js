export const typeDef = `
  type RenewLoanResponse {

    """
    Whether the loan was renewed or not.
    """
    renewed: Boolean!

    """
    Returns error message, if the renewal failed.
    """
    error: String

    """
    Returns due date of the loan, if renewal was successful.
    """
    dueDate: String
  }
`;
