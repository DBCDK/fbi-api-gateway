import { parseJedSubjects, resolveSearchHits } from "../utils/utils";

export const typeDef = `
type Language {
  """
  Language as displayable text
  """
  display: String!

  """
  ISO639-2 language code
  """
  isoCode: String!
  
  """
  ISO639-1 language code (2 letters)
  """
  iso639Set1: String!
  
  """
  ISO639-2 language code (3 letters)
  """
  iso639Set2: String!
}

type GeneralMaterialType {
  """
  code for materialType # @TODO - is this a finite list ?? - and where to get it
  """
  code: GeneralMaterialTypeCodeEnum!
  """
  Ths string to display
  """
  display: String!
  }
  
type SpecificMaterialType {
  """
  code for materialType
  """
  code: String!
  """
  Ths string to display
  """
  display: String!
  }
  
type MaterialType {
  """
  jed 1.1 - the general materialtype
  """
  materialTypeGeneral: GeneralMaterialType!
  
  """
  jed 1.1 - the specific materialtType
  """
  materialTypeSpecific: SpecificMaterialType!
}

enum FictionNonfictionCodeEnum {
  FICTION
  NONFICTION
  NOT_SPECIFIED
}
type FictionNonfiction {
  """
  Displayable overall category/genre. In Danish skønlitteratur/faglitteratur for literature, fiktion/nonfiktion for other types.
  """
  display: String!

  """
  Binary code fiction/nonfiction used for filtering
  """
  code: FictionNonfictionCodeEnum!
}
type DK5MainEntry {
  """
  Displayable main DK5 classification
  """
  display: String!

  """
  Main DK5 classification code
  """
  code: String!
  
  """
  The dk5Heading for the classification
  """
  dk5Heading: String!
}
type Work {
  """
  A unique identifier for tracking user interactions with this work.
  It is generated in the response and should be included in subsequent
  API calls when this work is selected.
  """
  traceId: String!

  """
  Unique identification of the work based on work-presentation id e.g work-of:870970-basis:54029519
  """
  workId: String!
  
  titles: WorkTitles!

  """
  Abstract of the entity
  """
  abstract: [String!]

  """
  Creators
  """
  creators: [CreatorInterface!]!

  """
  DK5 main entry for this work
  """
  dk5MainEntry: DK5MainEntry

  """
  Overall literary category/genre of this work. e.g. fiction or nonfiction. In Danish skønlitteratur/faglitteratur for literature, fiktion/nonfiktion for other types.
  """
  fictionNonfiction: FictionNonfiction
  
  """
  Date of latest publication
  """
  latestPublicationDate: String

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  materialTypes: [MaterialType!]!

  """
  Series for this work
  """
  series: [Series!]!
  
  """
  Literary/movie universes this work is part of, e.g. Wizarding World, Marvel Universe
  """
  universes: [Universe!]!

  """
  Subjects for this work
  """
  subjects: SubjectContainer!

  """
  The genre, (literary) form, type etc. of this work
  """
  genreAndForm: [String!]!

  """
  Worktypes for this work - 'none' replaced by 'other'
  """
  workTypes: [WorkTypeEnum!]!

  """
  The year this work was originally published or produced
  """
  workYear: PublicationYear

  """
  The main language(s) of the work's content
  """
  mainLanguages: [Language!]!

  """
  Details about the manifestations of this work
  """
  manifestations: Manifestations!
}
enum WorkTypeEnum {
  ANALYSIS
  ARTICLE
  BOOKDESCRIPTION
  GAME
  LITERATURE
  MAP
  MOVIE
  MUSIC
  OTHER
  PERIODICA
  PORTRAIT
  REVIEW
  SHEETMUSIC
  TRACK
}
type WorkTitles {
  """
  The main title(s) of the work
  """
  main: [String!]!

  """
  The full title(s) of the work including subtitles etc
  """
  full: [String!]!

  """
  Titles (in other languages) parallel to the main 'title' of the work
  """
  parallel: [String!]!

  """
  The sorted title of the entity
  """
  sort: String!

  """
  The title of the work that this expression/manifestation is translated from or based on. The original title(s) of a film which has a different distribution title.
  """
  original: [String!]

  """
  The standard title of the entity, used for music and movies
  """
  standard: String

  """
  The title of the entity with the language of the entity in parenthesis after. This field is only generated for non-danish titles.
  """
  titlePlusLanguage: String

  """
  Danish translation of the main title
  """
  translated: [String!]

  """
  detailed title for tv series 
  """
  tvSeries: TvSeries
}

type TvSeries {
  """
  Title of the tv serie
  """
  title: String

  """
  Dansih translated title of the tv serie
  """
  danishLaunchTitle: String

  """
  Detailed information about the episode
  """
  episode: TvSeriesDetails

  """
  Episode titles
  """
  episodeTitles: [String!]

  """
  Detailed information about the disc
  """
  disc: TvSeriesDetails

  """
  Detailed information about the season
  """
  season: TvSeriesDetails

  """
  Detailed information about the volume
  """
  volume: TvSeriesDetails
}

type TvSeriesDetails {
  display: String
  numbers: [Int!]
}
`;

export const resolvers = {
  Work: {
    creators(parent, args, context, info) {
      // Handle difference in structure from JED service
      if (Array.isArray(parent?.creators)) {
        return parent?.creators;
      }
      return [
        ...parent?.creators?.persons?.map((person) => ({
          ...person,
          __typename: "Person",
        })),
        ...parent?.creators?.corporations?.map((person) => ({
          ...person,
          __typename: "Corporation",
        })),
      ];
    },
    subjects(parent, args, context, info) {
      return {
        all: parseJedSubjects(parent?.subjects?.all),
        dbcVerified: parseJedSubjects(parent?.subjects?.dbcVerified),
      };
    },
    async manifestations(parent, args, context, info) {
      const manifestations = parent?.manifestations;
      const first = manifestations?.first || manifestations?.all?.[0];
      const latest = manifestations?.latest || manifestations?.all?.[0];
      const all = manifestations?.all || [];
      const bestRepresentation =
        manifestations?.bestRepresentations?.[0] || manifestations?.all?.[0];
      const bestRepresentations = manifestations?.bestRepresentations;
      const mostRelevant = manifestations?.mostRelevant || manifestations?.all;
      const searchHits = manifestations?.searchHits || null;

      return {
        first,
        latest,
        all,
        bestRepresentation,
        bestRepresentations,
        mostRelevant,
        searchHits,
      };
    },
  },
  Manifestations: {
    searchHits: resolveSearchHits,
  },
  MaterialType: {
    materialTypeGeneral(parent, args, context, info) {
      return parent.general;
    },
    materialTypeSpecific(parent, args, context, info) {
      return parent.specific;
    },
  },
  Language: {
    isoCode(parent, args, context, info) {
      return parent?.isoCode || parent?.iso639Set2 || "";
    },
  },
};
