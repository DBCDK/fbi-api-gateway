export const typeDef = `
type Draft_Language {
  """
  Language as displayable text
  """
  display: String!

  """
  ISO639-2 language code
  """
  isoCode: String!
}
type Draft_MaterialTypes {
  """
  The general type of material of the manifestation based on a grouping of bibliotek.dk material types, e.g. bøger, lydbøger etc. 
  """
  general: [String!]!

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  specific: [String!]!
}
type Draft_FictionNonfiction {
  """
  Displayable overall category/genre
  """
  display: String!

  """
  Binary code fiction/nonfiction used for filtering
  """
  code: String!
}
type Draft_DK5MainEntry {
  """
  Displayable main DK5 classification
  """
  display: String!

  """
  Main DK5 classification code
  """
  code: String!
}
type Draft_Work {
  """
  Unique identification of the work based on work-presentation id e.g work-of:870970-basis:54029519
  """
  workId: String!
  
  titles: Draft_WorkTitles!

  """
  Abstract of the entity
  """
  abstract: [String!]

  """
  Creators
  """
  creators: [Draft_Creator!]!

  """
  DK5 main entry for this work
  """
  dk5MainEntry: Draft_DK5MainEntry

  """
  Overall literary category/genre of this work. e.g. fiction or nonfiction. In Danish skønlitteratur/faglitteratur for literature, fiktion/nonfiktion for other types.
  """
  fictionNonfiction: Draft_FictionNonfiction

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  materialTypes: Draft_MaterialTypes!

  """
  Series for this work
  """
  series: Draft_SeriesContainer

  """
  Literary/movie universe this work is part of, e.g. Wizarding World, Marvel Universe
  """
  universe: Draft_Universe

  """
  Subjects for this work
  """
  subjects: Draft_SubjectContainer!

  """
  The genre, (literary) form, type etc. of this work
  """
  genreAndForm: [String!]!

  """
  Worktypes for this work - 'none' replaced by 'other'
  """
  workTypes: [Draft_WorkType!]!

  """
  The year this work was originally published or produced
  """
  workYear: String

  """
  The main language(s) of the work's content
  """
  mainLanguages: [Draft_Language!]!

  """
  Details about the manifestations of this work
  """
  manifestations: Draft_Manifestations!
}
enum Draft_WorkType {
  analysis
  article
  bookdescription
  game
  literature
  map
  movie
  music
  other
  periodica
  portrait
  review
  sheetmusic
  track
}
type Draft_WorkTitles {
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
  The title of the work that this expression/manifestation is translated from or based on. The original title(s) of a film which has added distribution titles in marc field 239 and 739
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
