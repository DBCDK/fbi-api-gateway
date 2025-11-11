import { resolveAccess } from "../utils/access";
import { extFromUrl, forceHttpsAndStripQa } from "../utils/publizon";

export const typeDef = `
enum AccessTypeCodeEnum {
  PHYSICAL
  ONLINE
  UNKNOWN
}
enum AccessUrlTypeEnum {
  IMAGE
  OTHER
  RESOURCE
  SAMPLE
  TABLE_OF_CONTENTS
  THUMBNAIL
}

enum LinkStatusEnum {
  BROKEN
  GONE
  INVALID
  OK
}

type AccessType {
  display: String!
  code: AccessTypeCodeEnum!
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

  """
  Notes for the resource
  """
  note: String
}
type AccessUrl {
  """
  The origin, e.g. "DBC Webarkiv"
  """
  origin: String!
  
  """
  Description/type of URL
  """
  urlText: String

  """
  The url where manifestation is located
  """
  url: String!
  
  """
  Notes for the resource
  """
  note: String
  
  """
  If the resource requires login
  """
  loginRequired: Boolean!

  """
  The type of content that can be found at this URL
  """
  type: AccessUrlTypeEnum
  
  """
  Status from linkcheck
  """
  status: LinkStatusEnum!
}
type InterLibraryLoan {
  """
  Is true when manifestation can be borrowed via ill
  """
  loanIsPossible: Boolean!
  """
  Is newly added - nice to know if there are no localizations
  """
  accessNew: Boolean!  
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

type Publizon {
  """
  URL of the sample provided by Publizon (Pubhub), typically a preview
  of the e-book or audiobook content.
  """
  sample: String!

  """
  The file format of the Publizon resource (e.g., "epub", "mp3").
  """
  format: String

  """
  The file size of the resource in bytes, if available.
  """
  fileSizeInBytes: Int

  """
  The total duration of the resource in seconds, if available.
  """
  durationInSeconds: Int
}

union AccessUnion = AccessUrl | Ereol | InterLibraryLoan | InfomediaService | DigitalArticleService | Publizon
`;

export const resolvers = {
  Manifestation: {
    async access(parent, args, context, info) {
      return resolveAccess(parent, context);
    },
  },

  // Normalization:
  // - remove .qa. subdomain
  // - force https
  // - override format from file extension (fallback to API format)

  Publizon: {
    async sample(parent, args, context, info) {
      // Hent produkt fra Publizon (Pubhub API)
      const product = await context.datasources
        .getLoader("products")
        .load({ isbn: parent?.isbn });

      // Rens og tving https
      return forceHttpsAndStripQa(product?.sampleUri);
    },

    async format(parent, args, context, info) {
      // Hent produkt
      const product = await context.datasources
        .getLoader("products")
        .load({ isbn: parent?.isbn });

      // 1) Udled fra sample-URL'ens ekstension
      const fromExt = extFromUrl(product?.sampleUri);
      if (fromExt) return fromExt; // fx 'epub' eller 'mp3'

      // 2) Fallback: produktets eget format, normaliseret til lowercase
      return product?.format?.toLowerCase?.() ?? null;
    },

    async fileSizeInBytes(parent, args, context, info) {
      const product = await context.datasources
        .getLoader("products")
        .load({ isbn: parent?.isbn });

      return product?.fileSizeInBytes ?? null;
    },

    async durationInSeconds(parent, args, context, info) {
      const product = await context.datasources
        .getLoader("products")
        .load({ isbn: parent?.isbn });

      return product?.durationInSeconds ?? null;
    },
  },
};
