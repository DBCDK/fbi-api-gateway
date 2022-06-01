import {
  getBaseUrl,
  getDigitalArticleAccessStatus,
  getInfomediaAccessStatus,
  resolveOnlineAccess,
} from "../../utils/utils";
import * as consts from "./FAKE";

export const typeDef = `
enum Draft_AccessTypeCode {
  PHYSICAL
  ONLINE
  NOT_SPECIFIED
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
type Draft_InterLibraryLoan {
  """
  Is true when manifestation can be borrowed via ill
  """
  loanIsPossible: Boolean!
}
type Draft_InfomediaService {
  """
  Infomedia ID which can be used to fetch article through Infomedia Service
  """
  id: String!

  """
  Can the current user obtain the article?
  """
  accessStatus: Draft_AccessStatus!
}
type Draft_DigitalArticleService {
  """
  Issn which can be used to order article through Digital Article Service
  """
  issn: String!

  """
  Can the current user obtain the article?
  """
  accessStatus: Draft_AccessStatus!
}
union Draft_Access = Draft_URL | Draft_Ereol | Draft_InterLibraryLoan | Draft_InfomediaService | Draft_DigitalArticleService
`;

export const resolvers = {
  Draft_InfomediaService: {
    accessStatus(parent, args, context, info) {
      return getInfomediaAccessStatus(context);
    },
  },
  Draft_DigitalArticleService: {
    accessStatus(parent, args, context, info) {
      return getDigitalArticleAccessStatus(context);
    },
  },
};
