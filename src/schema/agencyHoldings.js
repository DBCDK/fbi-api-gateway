/**
 * *** EXPERIMENTAL - EXPECT TO BE CHANGED ***
 * AgencyHoldings
 */
import { AgencyHoldingsFilterEnum } from "../datasources/agencyHoldings.datasource";

export const typeDef = `
enum AgencyHoldingsFilter {
  """The responder have at least 1 material available now"""
  ${AgencyHoldingsFilterEnum.AVAILABLE_NOW},
  """The responder have no materials available now, but at least 1 available later"""
  ${AgencyHoldingsFilterEnum.AVAILABLE_LATER},
  """The materials that no materials available now or later, and availability for all materials is unknown"""
  ${AgencyHoldingsFilterEnum.AVAILABLE_UNKNOWN},
  """The responders that returned an error"""
  ${AgencyHoldingsFilterEnum.ERRORS},
}

type AgencyHoldingsResponse {  
  """
  Count of unique agencies
  """
  countUniqueAgencies: Int!
  
  """
  AgencyIds
  """
  agencyIds: [String!]!
  
  """
  Number of calls to service (Here HoldingsService)
  """
  numberOfCallsToService: Int!
}`;
