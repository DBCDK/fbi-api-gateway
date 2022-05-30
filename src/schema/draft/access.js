import {getBaseUrl, resolveOnlineAccess} from '../../utils/utils';
import * as consts from './FAKE';

export const typeDef = `
enum Draft_AccessTypeCode {
  FYSISK
  ONLINE
  UKENDT
}
type Draft_AccessType {
  display: String!
  code: Draft_AccessTypeCode!
}
type Draft_Ereol {
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
type Draft_URL {
  """
  The origin, e.g. "DBC Webarkiv"
  """
  origin: String!

      """
  The url where manifestation is located
  """
  url: String!
}
type Draft_Ill {
  """
  Is true when manifestation can be borrowed via ill
  """
  ill: Boolean!
}
type Draft_InfomediaService {
  """
  Infomedia ID which can be used to fetch article through Infomedia Service
  """
  id: String!
}
type Draft_DigitalArticleService {
  """
  Issn which can be used to order article through Digital Article Service
  """
  issn: String!

      """
  Is true when access token belongs to a user whose municipality of residence is subscribed to Digital Article Service
  """
  subscribed: Boolean!
}
union Draft_Access = Draft_URL | Draft_Ereol | Draft_Ill | Draft_InfomediaService | Draft_DigitalArticleService
`;

export const resolvers = {};
