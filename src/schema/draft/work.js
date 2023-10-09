import { parseJedSubjects } from "../../utils/utils";

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
}

type GeneralMaterialType {
  """
  code for materialType # @TODO - is this a finite list ?? - and where to get it
  """
  code: GeneralMaterialTypeCode!
  """
  Ths string to display
  """
  display: String!
  }
  
type SpecificMaterialType {
  """
  code for materialType # @TODO - is this a finite list ?? - and where to get it
  """
  code: SpecificMaterialTypeCode!
  """
  Ths string to display
  """
  display: String!
  }
  
type MaterialType {
  """
  The general type of material of the manifestation based on a grouping of bibliotek.dk material types, e.g. bøger, lydbøger etc. 
  """
  general: String!

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  specific: String!
    
  """
  jed 1.1 - the general materialtype
  """
  MaterialTypeGeneral: GeneralMaterialType!
  
  """
  jed 1.1 - the specific materialtType
  """
  MaterialTypeSpecific: SpecificMaterialType!
  
  }
}



enum FictionNonfictionCode {
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
  code: FictionNonfictionCode!
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
  creators: [Creator!]!

  """
  DK5 main entry for this work
  """
  dk5MainEntry: DK5MainEntry

  """
  Overall literary category/genre of this work. e.g. fiction or nonfiction. In Danish skønlitteratur/faglitteratur for literature, fiktion/nonfiktion for other types.
  """
  fictionNonfiction: FictionNonfiction

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  materialTypes: [MaterialType!]!

  """
  Series for this work
  """
  series: [Series!]!

  """
  Members of a series that this work is part of
  """
  seriesMembers: [Work!]! @complexity(value: 5) @deprecated(reason: "Use 'Work.series.members' instead")
  
  """
  Literary/movie universe this work is part of, e.g. Wizarding World, Marvel Universe
  """
  universe: Universe

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
  workTypes: [WorkType!]!

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
enum WorkType {
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
      const mostRelevant = manifestations?.mostRelevant || manifestations?.all;

      return {
        first,
        latest,
        all,
        bestRepresentation,
        mostRelevant,
      };
    },
  },
  // MaterialType: {
  //   general(parent, args, context, info) {
  //     console.log(parent, "FISK");
  //     return null;
  //   },
  //
  //   //   """
  //   // The type of material of the manifestation based on bibliotek.dk types
  //   // """
  //   // specific: String!
  //   //
  //   //   """
  //   // jed 1.1 - the general materialtype
  //   // """
  //   // MaterialTypeGeneral: GeneralMaterialType!
  //   //
  //   //   """
  //   // jed 1.1 - the specific materialtType
  //   // """
  //   // MaterialTypeSpecific: SpecificMaterialType!
  //   //
  // },
};
