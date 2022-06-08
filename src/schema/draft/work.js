import { resolveOnlineAccess } from "./draft_utils_manifestations";

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
type MaterialType {
  """
  The general type of material of the manifestation based on a grouping of bibliotek.dk material types, e.g. bøger, lydbøger etc. 
  """
  general: String!

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  specific: String!
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
  seriesMembers: [Work!]!

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
  workYear: String

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
  Danish translation of the main title
  """
  translated: [String!]
}
`;

export const resolvers = {};
