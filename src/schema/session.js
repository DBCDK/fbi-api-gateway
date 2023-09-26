/**
 * @file Session type definition and resolvers
 *
 */

/**
 * The Session type definition
 */
const userParameters = `
  cpr: String,
  userId: String,
  barcode: String,
  cardno: String,
  customId: String,
  userDateOfBirth: String,
  userName: String,
  userAddress: String,
  userMail: String,
  userTelephone: String`;

export const typeDef = `
type SessionUserParameters {
  ${userParameters}
}
input SessionUserParametersInput {
  ${userParameters}
}
type Session {
  userParameters: SessionUserParameters
  allowSessionStorage: Boolean
  pickupBranch: String
}
input SessionInput {
  userParameters: SessionUserParametersInput
  allowSessionStorage: Boolean
  pickupBranch: String
}`;

/**
 * Resolvers for the Session type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
// export const resolvers = {
//   Session: {},
// };
