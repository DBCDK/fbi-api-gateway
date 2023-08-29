/**
 * @file Borchk type definition and resolvers
 *
 * Resolves responses from Borchk
 */

/**
 * The Request status type definition
 */
export const typeDef = `
enum BorchkResponseStatus {
  OK
  SERVICE_NOT_LICENSED
  SERVICE_UNAVAILABLE
  LIBRARY_NOT_FOUND
  BORROWERCHECK_NOT_ALLOWED
  BORROWER_NOT_FOUND
  BORROWER_NOT_IN_MUNICIPALITY
  MUNICIPALITY_CHECK_NOT_SUPPORTED_BY_LIBRARY
  NO_USER_IN_REQUEST
  ERROR_IN_REQUEST
}

input BorchkInput {
  libraryCode: String!
  userId: String! 
  userPincode: String
}

type BorchkResponse {
  """
  UserId of the requesting user (always the same as requested)
  """
  userId: String! 

  """
  The status of the requesting user
  """
  status: BorchkResponseStatus! 

  """
  MunicipalityNumber of the requesting user
  """
  municipalityNumber: String

  """
  Returns if the requesting user is blocked or not
  """
  blocked: Boolean
}`;

/**
 * Resolvers for the Cover type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  BorchkResponse: {
    status(parent, args) {
      return parent.requestStatus?.toUpperCase();
    },
  },
};
