export const typeDef = `
  type RenewLoanResponse {

    """
    Whether the order was deleted or not
    """
    statusCode: number!

    """
    Error message
    """
    errors: string

    """
    Error description
    """
    error_description: string

    """
    data
    """
    data: Data
  }

  type Data {
    loanId: String
    returnDate: String
    }
`;
