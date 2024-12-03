// Map from fbi-api enum uppercase to the casing that vip uses
const LIBRARY_TYPE_MAPPING = {
  ALLE: "Alle",
  FOLKEBIBLIOTEK: "Folkebibliotek",
  FORSKNINGSBIBLIOTEK: "Forskningsbibliotek",
  SKOILEBIBLIOTEK: "Skolebibliotek",
  OTHER: "Other",
};

// Map from fbi-api enum uppercase to the casing that vip uses
const LIBRARY_STATUS_MAPPING = {
  ALLE: "alle",
  AKTIVE: "aktive",
  USYNLIG: "usynlig",
  SLETTET: "slettet",
};

export const typeDef = `
enum VipLanguageTypeEnum {
  DAN
  ENG
}
type VipLanguageTypeAttribute {
  """
  Language type. Can be either "DAN" or "ENG".
  """
  language: VipLanguageTypeEnum
  """
  Value. Example: "Hillerød Bibliotek" or "Hillerød Public Library".
  """
  value: String
}
type Geolocation {
  """
  Latitudinal coordinate. Example: "55.680887".
  """
  latitude: Float
  """
  Longitudinal coordinate. Example: "12.573619".
  """
  longitude: Float
}
enum VipLibraryTypeEnum {
  ALLE
  FOLKEBIBLIOTEK
  FORSKNINGSBIBLIOTEK
  SKOILEBIBLIOTEK
  OTHER
}

enum VipLibraryStatusEnum {
  ALLE
  AKTIVE
  USYNLIG
  SLETTET
}

type VipProfile {
  """
  Profile name. Example: "opac".
  """
  profileName: String
  """
  Use present sources. Indicates if this profile uses available sources.
  """
  usePresentSources: Boolean

  """
  List of sources.
  """
  source: [VipSource]
}

type VipRelation {
  """
  RDF label. Example: "dbcaddi:continues".
  """
  rdfLabel: String
  """
  RDF inverse. The inverse RDF label. Example: "dbcaddi:continuedIn".
  """
  rdfInverse: String
}

type VipSource {
  """
  Source name. Example: "Artikelbasens avisartikler med infomedialink".
  """
  sourceName: String
  """
  Source searchable. Indicates whether the source is searchable.
  """
  sourceSearchable: Boolean
  """
  Source contained in. ID of the source that contains this source. Example: "870971-avis".
  """
  sourceContainedIn: String
  """
  Source identifier. Example: "870971-avisinf".
  """
  sourceIdentifier: String
  """
  Source owner. Only filled if not querying for v3. Example: "100200".
  """
  sourceOwner: String
  """
  Source format. Only filled if not querying for v3. Example: "catalog".
  """
  sourceFormat: String
  """
  List of the source's relations.
  """
  relation: [VipRelation]
}

enum VipResponseStatusEnum {
  OK_200
  NO_AUTHORISATION
}

type AgencyInfoResponse {
  result: [VipAgencyInfo!]!
  status: VipResponseStatusEnum!
}

type OpensearchProfilesResponse {
  result: [VipProfile!]!
  status: VipResponseStatusEnum!
}

type AutoIllParamsResponse {  
  automationParams: [AutomationParams]  
}

type AutomationParams {
    """
    AgencyId of given provider
    """
    provider: String
    """
    Ill parameters for given provider
    """
    materials: [Materials]
  }
type Materials {
    """
    Material id (1, 2, 3, 4, 5, 6, 7, 9)
    """
    material: Int!
    """
    Name of materialtype eg. "Bøger på dansk", "Lydmaterialer på bånd", osv.
    """
    name: String!
    """
    Does given provider loan this material ?
    """
    willProvide: Boolean!    
    """    
    Period from acquisition of material to ill loan eg. 60 (days)
    """
    period: Int!
}  

type VipResponse {
  agencyInfo(
    """
    Agency ID of the library, supports either agency ID or ISIL.
    Example: 721900, DK-721900
    """
    branchId: String

    """
    Agency name of the library, can be part of the name. Search is case-insensitive.
    Example: "hillerød" will find "Hillerød Bibliotekerne"
    """
    agencyName: String

    """
    Agency ID. Search for all libraries under a single main library. Also supports searching using ISIL.
    Example: 721900 will find 721900, 721902, 721903, and 721904
    Example: DK-721900 will find 721900, 721902, 721903, and 721904
    """
    agencyId: String

    """
    Agency address. Search using whole or part of the address. Search is case-insensitive.
    Example: "christian" will match "Christiansgade 1"
    """
    agencyAddress: String

    """
    Postal code. Search using a 4-digit Danish postal code.
    Example: 3400 or 9000
    """
    postalCode: String

    """
    City. Search using the whole or part of the city name. Search is case-insensitive.
    Example: "illerø" will match "Hillerød"
    """
    city: String

    """
    Last updated date.
    """
    lastUpdated: String

    """
    Library type. Search using the type of library.
    """
    libraryType: VipLibraryTypeEnum

    """
    Library status. Search using the library status.
    """
    libraryStatus: VipLibraryStatusEnum

    """
    Pickup allowed. Search for libraries that allow pickup. Can be "true" or "false".
    """
    pickupAllowed: Boolean
  ): AgencyInfoResponse! 
  opensearchProfiles(agencyId: String!, profileName: String): OpensearchProfilesResponse! 
  autoIll(agencyId: String): AutoIllParamsResponse!
}

type VipAgencyInfo {
  pickupAgency: VipAgency
}
type VipAgency {
  """
  Agency name. Example: "Hillerød Bibliotekerne".
  """
  agencyName: String
  """
  Agency ID. If this is a branch, this will be the main library's ID. Example: "721900".
  """
  agencyId: String!
  """
  Type of agency. Example: "Public Library".
  """
  agencyType: String
  """
  Agency email address. Example: "bibliotek@hillerod.dk".
  """
  agencyEmail: String
  """
  Agency phone number. Example: "72 32 58 00".
  """
  agencyPhone: String
  """
  Agency fax number. Example: "72 32 58 00".
  """
  agencyFax: String
  """
  Agency CVR number. Example: "29189366".
  """
  agencyCvrNumber: String
  """
  Agency P number. Example: "1003280670".
  """
  agencyPNumber: String
  """
  Agency EAN number. Example: "5798008307713".
  """
  agencyEanNumber: String
  """
  Agency branch ID. Example: "721902".
  """
  branchId: String!
  """
  Branch type. Example: "f".
  """
  branchType: String
  """
  Branch name. Example: "Skævinge" or "Skævinge Library".
  """
  branchName: [VipLanguageTypeAttribute]
  """
  Branch short name. Example: "Hillerød Bibliotekerne" or "Hillerød Library".
  """
  branchShortName: [VipLanguageTypeAttribute]
  """
  Branch phone number. Example: "72325900".
  """
  branchPhone: String
  """
  Branch email address. Example: "bibliotek@hillerod.dk".
  """
  branchEmail: String
  """
  Branch ILL email address. Example: "danbib@hillerod.dk".
  """
  branchIllEmail: String
  """
  Branch is an agency.
  """
  branchIsAgency: Boolean
  """
  Agency address. Example: "Christiansgade 1".
  """
  postalAddress: String
  """
  Agency postal code. Example: "3400".
  """
  postalCode: String
  """
  City. Example: "Hillerød".
  """
  city: String
  """
  Agency ISIL number. Example: "DK-721900".
  """
  isil: String
  """
  Junction. Routing drop-off point. Example: "715700".
  """
  junction: String
  """
  Branch P number. Example: "1003280670".
  """
  branchPNumber: String
  """
  Branch catalog URL. Example: "https://hilbib.dk".
  """
  branchCatalogueUrl: String
  """
  Lookup URL. Example: "https://hilbib.dk/work/work-of:870970-basis:".
  """
  lookupUrl: String
  """
  Branch website URL. Example: "https://hilbib.dk".
  """
  branchWebsiteUrl: String
  """
  Service declaration URL. Example: "https://www.hvidovrebib.dk".
  """
  serviceDeclarationUrl: String
  """
  Registration form URL. URL for registering new users. Example: "https://hilbib.dk/registration".
  """
  registrationFormUrl: String
  """
  Registration form URL text. Text shown with the URL for registering new users. Example: "Create a library user".
  """
  registrationFormUrlText: String
  """
  Library.dk support email. Example: "bibliotek@kff.kk.dk".
  """
  librarydkSupportEmail: String
  """
  Library.dk support phone. Example: "33 66 30 00".
  """
  librarydkSupportPhone: String
  """
  Agency subdivisions. List of the library’s subdivisions. Example: "Vigersted (Community Hall)", "Ørslev (Brugsen)", "Høm (Høm Byvej v. Smedemestervej 1)".
  """
  agencySubdivision: [String]
  """
  Opening hours. Example: "Opening hours\r\nSee opening hours on:\nbibliotek.kk.dk/biblioteker".
  """
  openingHours: [VipLanguageTypeAttribute]
  """
  Temporarily closed. Indicates if the library is temporarily closed.
  """
  temporarilyClosed: Boolean
  """
  Temporarily closed reason. Message when the library is temporarily closed.
  """
  temporarilyClosedReason: [VipLanguageTypeAttribute]
  """
  ILL order receipt text. Example: "https://bibliotek.kk.dk/help/general-info/library-regulations".
  """
  illOrderReceiptText: [VipLanguageTypeAttribute]
  """
  Pickup allowed. Indicates if the library allows material pickup.
  """
  pickupAllowed: Boolean
  """
  NCIP lookup user.
  """
  ncipLookupUser: Boolean
  """
  NCIP renew order.
  """
  ncipRenewOrder: Boolean
  """
  NCIP cancel order.
  """
  ncipCancelOrder: Boolean
  """
  NCIP update order.
  """
  ncipUpdateOrder: Boolean
  """
  NCIP server address. Example: "https://cicero-fbs.com/rest/ncip/".
  """
  ncipServerAddress: String
  """
  NCIP server password.
  """
  ncipPassword: String
  """
  Drop-off branch. Branch used for returning materials. Example: "710123".
  """
  dropOffBranch: String
  """
  Drop-off name. Name of the branch used for returns. Example: "Copenhagen Library central sorting".
  """
  dropOffName: String
  """
  Last update. The last update of the library’s VIP data. Example: "2024-08-11".
  """
  lastUpdated: String
  """
  Is OCLC library. The library has records in WorldCat.
  """
  isOclcRsLibrary: Boolean
  """
  State and university library copy service.
  """
  stateAndUniversityLibraryCopyService: Boolean
  """
  Geo location. Geographical coordinates.
  """
  geolocation: Geolocation
  """
  Head of institution name. Example: "Jakob Heide Petersen".
  """
  headOfInstitutionName: String
  """
  Head of institution title. Example: "Head of Copenhagen Libraries".
  """
  headOfInstitutionTitle: String
  """
  Branch service text. Example: "We lend books to big and small readers".
  """
  branchServiceTxt: String
  """
  National delivery service. Indicates if the library is part of the national delivery scheme.
  """
  nationalDeliveryService: Boolean
  """
  Will receive ILL. Indicates if the library accepts interlibrary loan requests.
  """
  willReceiveIll: Boolean
  """
  Will receive ILL text. Message when the library does not accept interlibrary loan requests. Example: "Faaborg Public Library is closed from 24/12 to 1/1. Danbib orders are not processed during this period. From 2/1, orders will be processed again at Faaborg-Midtfyn Libraries.".
  """
  willReceiveIllTxt: String
  """
  Localisation name. The name used in Netpunkt. Example: "KKB".
  """
  localisationName: String
  """
  Route number.
  """
  routeNumber: String
  """
  ILL service text. Example: "https://bibliotek.kk.dk/help/general-info/library-regulations".
  """
  illServiceTxt: String
  """
  Opening hours URL. Link to the library’s opening hours. Example: "https://www.bibliotek.alleroed.dk/opening-hours".
  """
  openingHoursUrl: String
  """
  Payment URL. Example: "https://www.hilbib.dk".
  """
  paymentUrl: String
  """
  Head of branch name. Name of the branch manager. Example: "Stine Holmstrøm Have".
  """
  headOfBranchName: String
  """
  Head of branch title. Example: "Library Manager".
  """
  headOfBranchTitle: String
}

type VipIso18626 {
  """
  ISO18626 address. ISO18626 server address. Example: "https://iso18626.addi.dk/copa-rs/app/iso18626/".
  """
  iso18626Address: String
  """
  ISO18626 password.
  """
  iso18626Password: String
}

type Vipz3950Ill {
  """
  Z39.50 address. Z39.50 server address. Example: "87.48.149.131:2100/default".
  """
  z3950Address: String
  """
  Z39.50 group ID.
  """
  z3950GroupId: String
  """
  Z39.50 user ID.
  """
  z3950UserId: String
  """
  Z39.50 password.
  """
  z3950Password: String
  """
  ILL request.
  """
  illRequest: Boolean
  """
  ILL answer.
  """
  illAnswer: Boolean
  """
  ILL shipped.
  """
  illShipped: Boolean
  """
  ILL cancel.
  """
  illCancel: Boolean
  """
  ILL cancel reply.
  """
  illCancelReply: Boolean
  """
  ILL cancel reply synchronous.
  """
  illCancelReplySynchronous: Boolean
  """
  ILL renew.
  """
  illRenew: Boolean
  """
  ILL renew answer.
  """
  illRenewAnswer: Boolean
  """
  ILL renew answer synchronous.
  """
  illRenewAnswerSynchronous: Boolean
}

extend type Query {
  """
  Returns null if authorization fails.
  """
  vip: VipResponse!
}

`;

async function danbibReadPermissions(context) {
  const isAuthenticated = !!context.smaug?.user?.id;

  let idpRights = [];
  if (isAuthenticated) {
    (
      await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      })
    )?.attributes?.dbcidp?.forEach((entry) =>
      entry?.rights?.forEach((rightEntry) => {
        idpRights.push(rightEntry);
      })
    );
  } else {
    // Anonymous tokens may have access via smaug configuration
    idpRights = context?.smaug?.anonymousIdpRights;
  }

  // Check permissions for accessing vip
  return idpRights?.find?.((rightsEntry) => {
    return (
      rightsEntry?.name === "READ" && rightsEntry?.productName === "DANBIB"
    );
  });
}
export const resolvers = {
  Query: {
    vip() {
      return {};
    },
  },
  VipLanguageTypeAttribute: {
    language(parent) {
      return parent?.language?.toUpperCase();
    },
  },
  VipResponse: {
    /**
     * Resolver to fetch autoIll paramters from vip-core
     */
    async autoIll(parent, args, context, info) {
      // Check permissions for accessing vip
      const danbibRead = await danbibReadPermissions(context);

      if (!danbibRead) {
        return [];
      }

      const res = await context.datasources
        .getLoader("vipautoIll")
        .load(args?.agencyId || "", context);

      return { automationParams: res?.automationParams };
    },

    async opensearchProfiles(parent, args, context, info) {
      const danbibRead = await danbibReadPermissions(context);
      if (!danbibRead) {
        return [];
      }

      const res = await context.datasources
        .getLoader("vipsearchprofiles")
        .load(args);

      return res?.profile || [];
    },
    async agencyInfo(parent, args, context, info) {
      const libraryType = LIBRARY_TYPE_MAPPING[args?.libraryType];
      const libraryStatus = LIBRARY_STATUS_MAPPING[args?.libraryStatus];

      // Check permissions for accessing vip
      const danbibRead = await danbibReadPermissions(context);

      if (!danbibRead) {
        return [];
      }

      const res = await context.datasources
        .getLoader("vipagencyinfo")
        .load({ ...args, libraryType, libraryStatus });

      return res?.agencyInfo || [];
    },
  },

  AgencyInfoResponse: {
    result(parent, args, context, info) {
      return parent;
    },

    async status(parent, args, context, info) {
      const danbibRead = await danbibReadPermissions(context);
      if (danbibRead) {
        return "OK_200";
      }
      return "NO_AUTHORISATION";
    },
  },

  OpensearchProfilesResponse: {
    result(parent, args, context, info) {
      return parent;
    },

    async status(parent, args, context, info) {
      const danbibRead = await danbibReadPermissions(context);
      if (danbibRead) {
        return "OK_200";
      }
      return "NO_AUTHORISATION";
    },
  },
};
