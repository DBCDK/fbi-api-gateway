import { mapWikidata } from "../utils/utils";

export const typeDef = `
type CreatorImage {
  """
  Url to creator image. Width 800px
  """
  small: String
  """
  Url to creator image. Width 1200px
  """
  medium: String
  """
  Url to creator image. Width 1800px
  """
  large: String
  attributionText: String
}

type Wikidata {
  education: [String!]
  image: CreatorImage
  nationality: String
  occupation: [String!]
  wikidataId: String
  description: String
  awards: [String!]
}

type CreatorInfo {
  display: String!
  firstName: String
  lastName: String
  viafid: String
  wikidata(language: LanguageCodeEnum): Wikidata
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
  wikidata(language: LanguageCodeEnum): Wikidata
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
    Additional data from Wikidata
    """
    wikidata(language: LanguageCodeEnum): Wikidata
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
  wikidata(language: LanguageCodeEnum): Wikidata
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

      if (!creatorInfoRaw?.viafId) {
        return null;
      }

      return {
        display: creatorInfoRaw?.display,
        firstName: creatorInfoRaw?.original?.firstname || null,
        lastName: creatorInfoRaw?.original?.lastname || null,
        viafid: creatorInfoRaw?.viafId || null,
        wikidata: mapWikidata(creatorInfoRaw),
      };
    },
  },
  CreatorInfo: {
    wikidata(parent, args) {
      const language = args?.language || "DA";
      const data = parent?.wikidata;
      if (!data) return null;
      return { ...data, language };
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
        const language = args?.language || "DA";
        const info = await context.datasources
          .getLoader("creatorByDisplayName")
          .load({ displayName: parent?.display });
        const data = mapWikidata(info);

        if (!data) return null;
        return { ...data, language };
      } catch (e) {
        return null;
      }
    },
  },
  Corporation: {
    roles(parent) {
      return Array.isArray(parent?.roles) ? parent?.roles : [];
    },
    wikidata(parent, args) {
      const language = args?.language || "DA";
      return { language: language };
    },
    viafid() {
      return null;
    },
  },
  Wikidata: {
    education(parent) {
      const language = parent?.language || "DA";
      const list = Array.isArray(parent?.education) ? parent.education : [];
      if (language === "DA") {
        return list
          .map((entry) => entry?.da ?? entry?.en ?? null)
          .filter((v) => v != null);
      }
      if (language === "EN") {
        return list
          .map((entry) => entry?.en ?? entry?.da ?? null)
          .filter((v) => v != null);
      }
      return [];
    },
    nationality(parent) {
      const language = parent?.language || "DA";
      const value = parent?.nationality || null;
      if (!value) return null;
      if (language === "DA") return value?.da ?? value?.en ?? null;
      if (language === "EN") return value?.en ?? value?.da ?? null;
      return null;
    },
    occupation(parent) {
      const language = parent?.language || "DA";
      const list = Array.isArray(parent?.occupation) ? parent.occupation : [];
      if (language === "DA") {
        return list
          .map((entry) => entry?.da ?? entry?.en ?? null)
          .filter((v) => v != null);
      }
      if (language === "EN") {
        return list
          .map((entry) => entry?.en ?? entry?.da ?? null)
          .filter((v) => v != null);
      }
      return [];
    },
    description(parent) {
      const language = parent?.language || "DA";
      const value = parent?.description || null;
      if (!value) return null;
      if (language === "DA") return value?.da ?? value?.en ?? null;
      if (language === "EN") return value?.en ?? value?.da ?? null;
      return null;
    },
    awards(parent) {
      const language = parent?.language || "DA";
      const list = Array.isArray(parent?.awards) ? parent.awards : [];
      if (language === "DA") {
        return list
          .map((entry) => entry?.da ?? entry?.en ?? null)
          .filter((v) => v != null);
      }
      if (language === "EN") {
        return list
          .map((entry) => entry?.en ?? entry?.da ?? null)
          .filter((v) => v != null);
      }
      return [];
    },
  },
};
