import {
  getBaseUrl,
  getDigitalArticleAccessStatus,
  getInfomediaAccessStatus,
  resolveOnlineAccess,
} from "../../utils/utils";
import * as consts from "./FAKE";

export const typeDef = `
enum AccessTypeCode {
  PHYSICAL
  ONLINE
  NOT_SPECIFIED
}
type AccessType {
  display: String!
  code: AccessTypeCode!
}
type Ereol {
  """
  The origin, e.g. "Ereolen" or "Ereolen Go"
  """
  origin: String!

      """
  The url where manifestation is located
  """
  url: String!

  """
  Is this a manifestation that always can be loaned on ereolen.dk even if you've run out of loans this month
  """
  canAlwaysBeLoaned: Boolean!
}
type AccessUrl {
  """
  The origin, e.g. "DBC Webarkiv"
  """
  origin: String!

      """
  The url where manifestation is located
  """
  url: String!
}
type InterLibraryLoan {
  """
  Is true when manifestation can be borrowed via ill
  """
  loanIsPossible: Boolean!
}
type InfomediaService {
  """
  Infomedia ID which can be used to fetch article through Infomedia Service
  """
  id: String!
}
type DigitalArticleService {
  """
  Issn which can be used to order article through Digital Article Service
  """
  issn: String!
}
union Access = AccessUrl | Ereol | InterLibraryLoan | InfomediaService | DigitalArticleService
`;

export const resolvers = {};
