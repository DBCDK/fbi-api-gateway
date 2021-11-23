/**
 * @file Periodica article order type definition and resolvers
 *
 */

export const typeDef = `
 input PeriodicaArticleOrder {
   """
   The pid of an article (Not the periodica)
   """
   pid: String! 
   pickUpBranch: String!
   userName: String
   userMail: String
 }
 enum PeriodicaArticleOrderStatus {
   OK
   ERROR_UNAUTHORIZED_USER
   ERROR_AGENCY_NOT_SUBSCRIBED
   ERROR_INVALID_PICKUP_BRANCH
   ERROR_PID_NOT_RESERVABLE
 }
 type PeriodicaArticleOrderResponse {
   status: PeriodicaArticleOrderStatus!
 }
 `;

export const resolvers = {};
