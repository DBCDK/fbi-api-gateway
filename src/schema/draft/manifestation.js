import { resolveOnlineAccess } from "./draft_utils_manifestations";
import * as consts from "./FAKE";

export const typeDef = `
type TableOfContent {
  heading: String
  content: String
  listOfContent: [TableOfContent!]
}
type Shelfmark {
  """
  A postfix to the shelfmark, eg. 99.4 Christensen, Inger. f. 1935
  """
  postfix: String!

  """
  The actual shelfmark - e.g. information about on which shelf in the library this manifestation can be found, e.g. 99.4
  """
  shelfmark: String!
}

type PhysicalDescription {
  """
  A summary of the physical description of this manifestation like extent (pages/minutes), illustrations etc.
  """
  summary: String!
  
  """
  Material that comes with the manifestation (bilag)
  """
  accompanyingMaterial: String
  
  """
  Additional physical description of the manifestation (e.g illustrations etc)
  """
  additionalDescription: String
  
  """
  Extent of the manifestation like pages and number of items
  """
  extent: String
  
  """
  Number of pages of the manifestation as number
  """
  numberOfPages: Int

  """
  Number of units, like 3 cassettes, or 1 score etc.
  """
  numberOfUnits: Int

  """
  The playing time of the manifestation (e.g 2 hours 5 minutes)
  """
  playingTime: String

  """
  The necessary equipment to use the material
  """
  requirements: String

  """
  Size of the manifestation
  """
  size: String

  """
  Technical information about the manifestation (e.g blu-ray disc)
  """
  technicalInformation: String

  """
  Ratio of text vs. illustration from 1-5 as a number, where 1 means no illustrations and 5 means illustrations on all pages
  """
  textVsIllustrations: Int
}
type RelatedPublication {
  """
  Notes describing the relation of the related periodical/journal/publication
  """
  heading: String!

  """
  Title of the related periodical/journal
  """
  title: [String!]!
  
  """
  ISSN of the related periodical/journal/publication
  """
  issn: String

  """
  ISBN of the related publication
  """
  isbn: String
  
  """
  Note regarding the URL of the related publication
  """
  urlText: String
  
  """
  URL of the related publication
  """
  url: String
}
enum NoteType {
  CONNECTION_TO_OTHER_WORKS
  DESCRIPTION_OF_MATERIAL
  DISSERTATION
  LANGUAGE
  MUSICAL_ENSEMBLE_OR_CAST
  NOT_SPECIFIED
  OCCASION_FOR_PUBLICATION
  ORIGINAL_TITLE
  ORIGINAL_VERSION
  REFERENCES
  RESTRICTIONS_ON_USE
}
enum ChildOrAdultCode {
  FOR_CHILDREN
  FOR_ADULTS
}
type ChildOrAdult {
  display: String!
  code: ChildOrAdultCode!
}
enum SchoolUseCode {
  FOR_SCHOOL_USE
  FOR_TEACHER
}
type SchoolUse {
  display: String!
  code: SchoolUseCode!
}
type Note {
  """
  The type of note - e.g. note about language, genre etc, NOT_SPECIFIED if not known. 
  """
  type: NoteType!

  """
  Heading before note
  """
  heading: String

  """
  The actual notes
  """
  display: [String!]!  
}
enum ManifestationPartType {
  MUSIC_TRACKS
  SHEET_MUSIC_CONTENT
  PARTS_OF_BOOK
  NOT_SPECIFIED
}
type ManifestationPart {
  """
  The title of the entry (music track or title of a literary analysis)
  """
  title: String!

  """
  The creator of the music track or literary analysis
  """
  creators: [Creator!]!

  """
  Classification of this entry (music track or literary analysis)
  """
  classifications: [Classification!]!

  """
  Subjects of this entry (music track or literary analysis)
  """
  subjects: [Subject!]

  """
  Additional creator or contributor to this entry (music track or literary analysis) as described on the publication. E.g. 'arr.: H. Cornell'
  """
  creatorsFromDescription: [String!]!
}
type ManifestationParts {
  """
  Heading for the music content note
  """
  heading: String

  """
  The creator and title etc of the individual parts
  """
  parts: [ManifestationPart!]!

  """
  The type of manifestation parts, is this music tracks, book parts etc.
  """
  type: ManifestationPartType!
}
type Languages {
  """
  Main language of this manifestation
  """
  main: [Language!]

  """
  Original language of this manifestation
  """
  original: [Language!]

  """
  Parallel languages of this manifestation, if more languages are printed in the same book
  """
  parallel: [Language!]

  """
  Spoken language in this manifestation e.g. dubbed/syncronized language in movie
  """
  spoken: [Language!]

  """
  Subtitles in this manifestation
  """
  subtitles: [Language!]

  """
  Summary/abstract languages of this manifestation, if the manifestation contains short summaries of the content in another language
  """
  abstract: [Language!]
}
enum IdentifierType {
  DOI
  ISBN
  ISSN
  ISMN
  MUSIC
  MOVIE
  PUBLIZON
  NOT_SPECIFIED
  ORDER_NUMBER
  BARCODE
}
type Identifier {
  """
  The type of identifier
  """
  type: IdentifierType!

  """
  The actual identifier
  """
  value: String!
}
type HostPublication {
  """
  Publication this manifestation can be found in
  """
  title: String!
  
  """
  Creator of the host publication if host publication is book
  """
  creator: String

  """
  ISSN of the publication this manifestation can be found in
  """
  issn: String

  """
  ISBN of the publication this manifestation can be found in
  """
  isbn: String

  """
  The issue of the publication this manifestation can be found in
  """
  issue: String

  """
  Notes about the publication where this manifestation can be found in
  """
  notes: [String!]

  """
  The pages in the publication where this manifestation can be found in
  """
  pages: String

  """
  The publisher of the publication where this manifestation can be found in
  """
  publisher: String

  """
  Series of the publication this manifestation can be found in
  """
  series: Series

  """
  The publication year of the publication this manifestation can be found in
  """
  year: PublicationYear

  """
  All details about the publication this manifestation can be found in
  """
  summary: String!
}
type Printing {
  """
  Properties 'printing' and 'publicationYear' as one string, e.g.: '11. oplag, 2020'
  """
  summary: String!

  """
  The printing number and name
  """
  printing: String!

  """
  A year as displayable text and as number
  """
  publicationYear: PublicationYear
}
type PublicationYear {
  display: String!
  year: Int
  endYear: Int
  frequency: String
}
type Edition {
  """
  Properties 'edition', 'contributorsToEdition' and 'publicationYear' as one string, e.g.: '3. udgave, revideret af Hugin Eide, 2005'
  """
  summary: String!
  
  """
  The edition number and name
  """
  edition: String

  """
  Quotation of contributor statements related to the edition
  """
  contributors: [String!]! 

  """
  A year as displayable text and as number
  """
  publicationYear: PublicationYear
}
enum EntryType {
  MAIN_ENTRY
  NATIONAL_BIBLIOGRAPHY_ENTRY
  ADDITIONAL_ENTRY
}
type Classification {
  """
  The classification code
  """
  code: String!

  """
  Descriptive text for the classification code (DK5 only)
  """
  display: String!

  """
  For DK5 only. The DK5 entry type: main entry, national entry, or additional entry
  """
  entryType: EntryType

  """
  Name of the classification system
  """
  system: String!
}
type Audience {
  """
  Appropriate audience for this manifestation
  """
  generalAudience: [String!]!

  """
  Range of numbers with either beginning of range or end of range or both e.g. 6-10, 1980-1999
  """
  ages: [Range!]!
  
  """
  Appropriate audience as recommended by the library
  """
  libraryRecommendation: String

  """
  Is this material for children or adults
  """
  childrenOrAdults: [ChildOrAdult!]!

  """
  Is this material for use in schools (folkeskole/ungdomsuddannelse) or is this material for use in schools by the teacher (folkeskole only)
  """
  schoolUse: [SchoolUse!]!
  
  """
  Primary target audience for this manifestation
  """
  primaryTarget: [String!]!

  """
  LET number of this manifestion, defines the reability level, LET stands for l??seegnethedstal
  """
  let: String
  
  """
  Lix number of this manifestion, defines the reability level, Lix stands for l??sbarhedsindex
  """
  lix: String
}

type CatalogueCodes {
  """
  Catalogue codes for the national bibliography 
  """
  nationalBibliography: [String]!
  """
  other catalogue codes 
  """
  otherCatalogues: [String]!
}

type Manifestations {
  first: Manifestation!
  latest: Manifestation!
  all: [Manifestation!]!
}
type Manifestation {
  """
  Unique identification of the manifestation e.g 870970-basis:54029519
  """
  pid: String!

  """
  Different kinds of titles for this work
  """
  titles: ManifestationTitles!

  """
  Abstract of the entity
  """
  abstract: [String!]!

  """
  Access type of this manifestation
  """
  accessTypes: [AccessType!]!

  """
  Different options to access manifestation
  """
  access: [Access!]!

  """
  Different kinds of definitions of appropriate audience for this manifestation
  """
  audience: Audience

  """
  CatalogueCodes for nationalBibliography and others
  """
  catalogueCodes: CatalogueCodes
  """
  Contributors to the manifestation, actors, illustrators etc
  """
  contributors: [Creator!]!

  """
  Additional contributors of this manifestation as described on the publication. E.g. 'p?? dansk ved Vivi Berendt'
  """
  contributorsFromDescription: [String!]!

  """
  Cover for this manifestation
  """
  cover: Cover!

  """
  Primary creators of the manifestation e.g. authors, directors, musicians etc
  """
  creators: [Creator!]!

  """
  Additional creators of this manifestation as described on the publication. E.g. 'tekst af William Warren'
  """
  creatorsFromDescription: [String!]!
  
  """
  Classification codes for this manifestation from any classification system
  """
  classifications: [Classification!]!

  """
  Edition details for this manifestation
  """
  edition: Edition!

  """
  Details about the latest printing of this manifestation
  """
  latestPrinting: Printing

  """
  Overall literary category/genre of this manifestation. e.g. fiction or nonfiction. In Danish sk??nlitteratur/faglitteratur for literature, fiktion/nonfiktion for other types.
  """
  fictionNonfiction: FictionNonfiction

  """
  The genre, (literary) form, type etc. of this manifestation
  """
  genreAndForm: [String!]!

  """
  Details about the host publications of this manifestation
  """
  hostPublication: HostPublication

  """
  Identifiers for this manifestation - often used for search indexes
  """
  identifiers: [Identifier!]!

  """
  Languages in this manifestation
  """
  languages: Languages

  """
  Tracks on music album, sheet music content, or articles/short stories etc. in this manifestation
  """
  manifestationParts: ManifestationParts

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  materialTypes: [MaterialType!]!

  """
  Notes about the manifestation
  """
  notes: [Note!]!

  """
  Notes about relations to this book/periodical/journal, - like previous names or related journals
  """
  relatedPublications: [RelatedPublication!]!

  """
  Physical description of this manifestation like extent (pages/minutes), illustrations etc.
  """
  physicalDescriptions: [PhysicalDescription!]!

  """
  The publication year of the manifestation - OBS! was datePublished
  """
  publicationYear: PublicationYear!

  """
  Publisher of this manifestion
  """
  publisher: [String!]!

  """
  The creation date of the record describing this manifestation in the format YYYYMMDD
  """
  recordCreationDate: String!

  """
  Series for this work
  """
  series: [Series!]!

  """
  Information about on which shelf in the library this manifestation can be found
  """
  shelfmark: Shelfmark

  """
  The source of the manifestation, e.g. own library catalogue (Bibliotekskatalog) or online source e.g. Filmstriben, Ebook Central, eReolen Global etc.
  """
  source: [String!]!

  """
  Subjects for this manifestation
  """
  subjects: SubjectContainer!

  """
  Information about on which volume this manifestation is in multi volume work
  """
  volume: String

  """
  Quotation of the manifestation's table of contents or a similar content list
  """
  tableOfContents: TableOfContent

}
type ManifestationTitles {
  """
  The main title(s) of the work
  """
  main: [String!]!

  """
  The full title(s) of the work including subtitles etc
  """
  full: [String!]!

  """
  The sorted title of the entity
  """
  sort: String!

  """
  Alternative titles for this manifestation e.g. a title in a different language
  """
  alternative: [String!]!

  """
  Information that distinguishes this manifestation from a similar manifestation with same title, e.g. 'illustrated by Ted Kirby'
  """
  identifyingAddition: String

  """
  The title of the work that this expression/manifestation is translated from or based on. The original title(s) of a film which has a different distribution title.
  """
  original: [String!]

  """
  Titles (in other languages) parallel to the main 'title' of the work
  """
  parallel: [String!]!

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

export const resolvers = {
  Manifestation: {
    async access(parent, args, context, info) {
      const resolved = await resolveOnlineAccess(parent.pid, context);
      return resolved;
    },
    async cover(parent, args, context, info) {
      return parent?.pid
        ? context.datasources.moreinfoCovers.load(parent.pid)
        : {};
    },
  },
};
