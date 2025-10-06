import { mapWikidata } from "../utils/utils";

export const typeDef = `
type LocalizedString {
  da: String
  en: String
}

type CreatorImage {
  url: String
  isFreeLicense: Boolean
  attributionText: String
}

type Wikidata {
  education: [LocalizedString!]
  image: CreatorImage
  nationality: LocalizedString
  occupation: [LocalizedString!]
  wikidataId: String
  description: LocalizedString
  awards: [LocalizedString!]
}

type CreatorInfo {
  display: String!
  firstName: String
  lastName: String
  viafid: String
  wikidata: Wikidata
}

type Translation {
  """
  Translation in plural form, e.g. forfattere, komponister, instruktører etc.
  """
  plural: String!

  """
  Translation in singular form, e.g. forfatter, komponist, instruktør
  """
  singular: String!
}
type Role {
  """
  The code for the type of creator or contributor, e.g. 'aut' for author, 'ill' for illustrator etc
  """
  functionCode: String!

  """
  The type of creator/contributor as text in singular and plural in Danish, e.g. forfatter/forfattere, komponist/komponister etc
  """
  function: Translation!

}
type Person implements SubjectInterface & CreatorInterface {
  
  """
  The person's whole name in normal order
  """
  display: String!

  """
  The person's full name inverted
  """
  nameSort: String!

  """
  First name of the person
  """
  firstName: String

  """
  Last name of the person
  """
  lastName: String

  """
  Birth year of the person
  """
  birthYear: String

  """
  A roman numeral added to the person, like Christian IV
  """
  romanNumeral: String

  """
  Added information about the person, like Henri, konge af Frankrig
  """
  attributeToName: String

  """
  Creator aliases, creators behind used pseudonym
  """
  aliases: [Person!]!

  """
  A list of which kinds of contributions this person made to this creation
  """
  roles: [Role!]!

  type: SubjectTypeEnum!

  language: Language
  local: Boolean

  """
  VIAF identifier of the creator
  """
  viafid: String

  """
  Additional metadata for the creator
  """
  wikidata: Wikidata
}
type Corporation implements SubjectInterface & CreatorInterface {
    """
    The full corporation or conference name
    """
    display: String!

    """
    The full corporation or conference name to sort after
    """
    nameSort: String!

    """
    Main corporation or conference
    """
    main: String

    """
    Sub corporation or conference/meeting
    """
    sub: String

    """
    Location or jurisdiction of the corporation or conference, like Københavns Kommune, Statistisk Kontor
    """
    location: String

    """
    Year of the conference
    """
    year: String

    """
    Number of the conference
    """
    number: String

    """
    Added information about the corporation, like M. Folmer Andersen (firma)
    """
    attributeToName: String

    """
    A list of which kinds of contributions this corporation made to this creation
    """
    roles: [Role!]!

    type: SubjectTypeEnum!

    language: Language
    local: Boolean

    """
    VIAF identifier of the creator
    """
    viafid: String

    """
    Additional metadata for the creator
    """
    wikidata: Wikidata
}
interface CreatorInterface {
  """
  Name of the creator
  """
  display: String!

  """
  Name of the creator which can be used to sort after 
  """
  nameSort: String!
  
  """
  A list of which kinds of contributions this creator made to this creation
  """
  roles: [Role!]!

  """
  VIAF identifier of the creator
  """
  viafid: String

  """
  Additional data from Wikidata
  """
  wikidata: Wikidata
}

extend type Query {
  """
  Fetch a creator by VIAF identifier
  """
  creatorByViafid(viafid: String!): CreatorInfo
}
`;

export const resolvers = {
  Query: {
    async creatorByViafid(parent, args, context) {
      const creatorInfoRaw = await context.datasources
        .getLoader("creatorByViafid")
        .load({ viafid: args.viafid });
      return {
        display: creatorInfoRaw?.display,
        firstName: creatorInfoRaw?.original?.firstname || null,
        lastName: creatorInfoRaw?.original?.lastname || null,
        viafid: creatorInfoRaw?.viafId || null,
        wikidata: mapWikidata(creatorInfoRaw),
      };
    },
  },
  Person: {
    roles(parent, args, context, info) {
      return Array.isArray(parent?.roles) ? parent?.roles : [];
    },
    aliases(parent) {
      return Array.isArray(parent?.aliases) ? parent?.aliases : [];
    },
    async viafid(parent, args, context) {
      try {
        if (parent?.viafid) return parent.viafid;
        const info = await context.datasources
          .getLoader("creatorByDisplayName")
          .load({ displayName: parent?.display });
        return info?.viafId || null;
      } catch (e) {
        return null;
      }
    },
    async wikidata(parent, args, context) {
      try {
        const info = await context.datasources
          .getLoader("creatorByDisplayName")
          .load({ displayName: parent?.display });
        return mapWikidata(info);
      } catch (e) {
        return null;
      }
    },
  },
  Corporation: {
    roles(parent) {
      return Array.isArray(parent?.roles) ? parent?.roles : [];
    },
    viafid() {
      return null;
    },
    async wikidata(parent, args, context) {
      return null;
    },
  },
};
