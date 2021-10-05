/**
 * @file Session type definition and resolvers
 *
 */

/**
 * The Session type definition
 */
export const typeDef = `
type UserParameters {
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
type Session {
  userParameters: UserParameters
  pickupBranch: String
}
input SessionInput {
  userParameters: SubmitOrderUserParameters
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
