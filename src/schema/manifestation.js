import { parseJedSubjects, resolveWork } from "../utils/utils";
import { log } from "dbc-node-logger";

const IDENTIFIER_TYPES = new Set([
  "UPC",
  "URI",
  "DOI",
  "ISBN",
  "ISSN",
  "ISMN",
  "MUSIC",
  "MOVIE",
  "PUBLIZON",
  "NOT_SPECIFIED",
  "ORDER_NUMBER",
  "BARCODE",
]);

export const typeDef = `
type CatalogueCodes {
  """
  CatalogueCodes from the national registers
  """
  nationalBibliography: [String!]!
  
  """
  CatalogueCodes from local bibliographies or catalogues that the manifestation belongs to
  """
  otherCatalogues: [String!]!
}
type TableOfContent {
  heading: String
  content: String
  listOfContent: [TableOfContent!]
}
type Shelfmark {
  """
  A postfix to the shelfmark, eg. 99.4 Christensen, Inger. f. 1935
  """
  postfix: String

  """
  The actual shelfmark - e.g. information about on which shelf in the library this manifestation can be found, e.g. 99.4
  """
  shelfmark: String!
}

type UnitDescription {
  """
  Assemblance of the data from all the other properties, separated by a comma
  """
  summary: String!

  """
  Technical formats, e.g. Playstation 4, blu-ray
  """
  numberAndType: String

  """
  Number of pages, tab (books, articles etc.) or playingtime (cd, dvd etc.)
  """
  extent: String

  """
  Other physical description, eg. illustrations, color or b/w, mono/stereo, rpm
  """
  additionalDescription: String

  """
  Size of the material unit
  """
  size: String

  """
  Technical formats, e.g. Playstation 4, blu-ray
  """
  technicalInformation: String
}

type PhysicalUnitDescription {
  """
  A summary of the physical description of this manifestation like extent (pages/minutes), illustrations etc.
  """
  summaryFull: String
  
  """
  List of units contained within the material
  """
  materialUnits: [UnitDescription!]

  """
  Number of pages of the manifestation as number
  """
  numberOfPages: Int

  """
  Material that comes with the manifestation (bilag)
  """
  accompanyingMaterial: String
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
  Faust of the related publication
  """
  faust: String
  
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
enum NoteTypeEnum {
  CONNECTION_TO_OTHER_WORKS
  DESCRIPTION_OF_MATERIAL
  DISSERTATION
  MUSICAL_ENSEMBLE_OR_CAST
  NOT_SPECIFIED @fallback
  OCCASION_FOR_PUBLICATION
  ORIGINAL_TITLE
  ORIGINAL_VERSION
  REFERENCES
  RESTRICTIONS_ON_USE
  TYPE_OF_SCORE
  FREQUENCY
  EDITION
  TECHNICAL_REQUIREMENTS
  ESTIMATED_PLAYING_TIME_FOR_GAMES
  EXPECTED_PUBLICATION_DATE
  WITHDRAWN_PUBLICATION
  CONTAINS_AI_GENERATED_CONTENT
}
enum ChildOrAdultCodeEnum {
  FOR_CHILDREN
  FOR_ADULTS @fallback
}
type ChildOrAdult {
  display: String!
  code: ChildOrAdultCodeEnum!
}
enum SchoolUseCodeEnum {
  FOR_SCHOOL_USE @fallback
  FOR_TEACHER
}
type SchoolUse {
  display: String!
  code: SchoolUseCodeEnum!
}
type Note {
  """
  The type of note - e.g. note about language, genre etc, NOT_SPECIFIED if not known. 
  """
  type: NoteTypeEnum!

  """
  Heading before note
  """
  heading: String

  """
  The actual notes
  """
  display: [String!]!  
}
enum ManifestationPartTypeEnum {
  MUSIC_TRACKS
  SHEET_MUSIC_CONTENT
  PARTS_OF_BOOK
  NOT_SPECIFIED @fallback
}
type ManifestationPart {
  """
  The title of the entry (music track or title of a literary analysis)
  """
  title: String!

  """
  The creator of the music track or literary analysis
  """
  creators: [CreatorInterface!]!

  """
  Classification of this entry (music track or literary analysis)
  """
  classifications: [Classification!]!

  """
  Subjects of this entry (music track or literary analysis)
  """
  subjects: [SubjectInterface!]

  """
  Additional creator or contributor to this entry (music track or literary analysis) as described on the publication. E.g. 'arr.: H. Cornell'
  """
  creatorsFromDescription: [String!]!
  
  """
  Contributors from description - additional contributor to this entry
  """
  contributorsFromDescription: [String!]!
  
  """
  The playing time for this specific part (i.e. the duration of a music track) 
  """
  playingTime: String
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
  type: ManifestationPartTypeEnum!
}
type Languages {
  """
  Notes of the languages that describe subtitles, spoken/written (original, dubbed/synchonized), visual interpretation, parallel (notes are written in Danish)
  """
  notes: [String!]

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
enum IdentifierTypeEnum {
  UPC
  URI
  DOI
  ISBN
  ISSN
  ISMN
  MUSIC
  MOVIE
  PUBLIZON
  NOT_SPECIFIED @fallback
  ORDER_NUMBER
  BARCODE
}
type Identifier {
  """
  The type of identifier
  """
  type: IdentifierTypeEnum!

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
  Edition statement for the host publication
  """
  edition: String

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
  Publisher of printing when other than the original publisher of the edition (260*b)
  """
  publisher: String

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
  A note about this specific edition
  """
  note: String
  
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
enum EntryTypeEnum {
  ADDITIONAL_ENTRY @fallback
  MAIN_ENTRY
  NATIONAL_BIBLIOGRAPHY_ENTRY
  NATIONAL_BIBLIOGRAPHY_ADDITIONAL_ENTRY
}
type Classification {
  """
  The classification code
  """
  code: String!
  
  """
  The dk5Heading for the classification (DK5 only)
  """
  dk5Heading: String

  """
  Descriptive text for the classification code (DK5 only)
  """
  display: String!
 
  """
  For DK5 only. The DK5 entry type: main entry, national entry, or additional entry
  """
  entryType: EntryTypeEnum

  """
  Name of the classification system
  """
  system: String!
}

type Players{
  """
  Number of players interval begin.
  """
  begin: Int
  """
  Number of players interval end.
  """
  end: Int
  """
  Display name for the number of players.
  """
  display: String
}

type PEGI {
  """Minimum age to play the game. PEGI rating"""
  minimumAge: Int

  """Display string for PEGI minimum age"""
  display: String
}

type MediaCouncilAgeRestriction {
  """Minimum age"""
  minimumAge: Int

  """Display string for minimum age"""
  display: String
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
  Level of difficulty, illustrations, length, and realism in children's literature
  """
  levelForChildren8to12: LevelForAudience

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
  LET number of this manifestion, defines the reability level, LET stands for læseegnethedstal
  """
  let: String
  
  """
  Lix number of this manifestion, defines the reability level, Lix stands for læsbarhedsindex
  """
  lix: String

  """
  Number of players in the game.
  """
  players: Players

  """
  PEGI age rating for games 
  """
  PEGI: PEGI @deprecated(reason: "Use 'Audience.pegi' instead expires: 01/06-2025")

  """
  PEGI age rating for games 
  """
  pegi: PEGI

  """
  Media council age recommendation
  """
  mediaCouncilAgeRestriction: MediaCouncilAgeRestriction

}

type LevelForAudience {
  """
  Level expressed as integer on a scale from 1 to 5
  """
  difficulty: Int

  """
  Level expressed as integer on a scale from 1 to 5
  """
  illustrationsLevel: Int

  """
  Level expressed as integer on a scale from 1 to 5
  """
  length: Int

  """
  Level expressed as integer on a scale from 1 to 5
  """
  realisticVsFictional: Int
}

"""
A search hit that encapsulates a matched manifestation from a search query.
"""
type SearchHit {
  """
  The manifestation that was matched during the search.
  """
  match: Manifestation
}

type Manifestations {
  first: Manifestation!
  latest: Manifestation!
  all: [Manifestation!]! @complexity(value: 50)
  bestRepresentation: Manifestation! 
  bestRepresentations: [Manifestation!]! 
  mostRelevant: [Manifestation!]! @complexity(value: 25)

  """
  A list of manifestations that matched the search query.

  This field is populated only when a work is retrieved within a search context.
  Each entry is a SearchHit object representing a manifestation that matched the search criteria.
  Only one manifestation per unit is returned.
  """
  searchHits: [SearchHit!]
}

type Manifestation {
  """
  A unique identifier for tracking user interactions with this manifestation. 
  It is generated in the response and should be included in subsequent
  API calls when this manifestation is selected.
  """
  traceId: String!

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
  access: [AccessUnion!]!

  """
  Different kinds of definitions of appropriate audience for this manifestation
  """
  audience: Audience
  
  """
  CatalogueCodes divided in codes from the national bibliography and other codes
  """
  catalogueCodes: CatalogueCodes!
  
  """
  Classification codes for this manifestation from any classification system
  """
  classifications: [Classification!]!

  """
  Contributors to the manifestation, actors, illustrators etc
  """
  contributors: [CreatorInterface!]!

  """
  Additional contributors of this manifestation as described on the publication. E.g. 'på dansk ved Vivi Berendt'
  """
  contributorsFromDescription: [String!]!

  """
  Cover for this manifestation
  """
  cover: Cover!

  """
  Primary creators of the manifestation e.g. authors, directors, musicians etc
  """
  creators: [CreatorInterface!]!

  """
  Additional creators of this manifestation as described on the publication. E.g. 'tekst af William Warren'
  """
  creatorsFromDescription: [String!]!
  
  """
  The year for the publication of the first edition for this work 
  """
  dateFirstEdition: PublicationYear

  """
  Edition details for this manifestation
  """
  edition: Edition

  """
  Details about the latest printing of this manifestation
  """
  latestPrinting: Printing

  """
  Overall literary category/genre of this manifestation. e.g. fiction or nonfiction. In Danish skønlitteratur/faglitteratur for literature, fiktion/nonfiktion for other types.
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
  The work that this manifestation is part of
  """
  ownerWork: Work! @complexity(value: 5)

  """
  Notes about relations to this book/periodical/journal, - like previous names or related journals
  """
  relatedPublications: [RelatedPublication!]!
  
  """
  Physical description  of this manifestation like extent (pages/minutes), illustrations etc.
  """
  physicalDescription: PhysicalUnitDescription

  """
  Publisher of this manifestion
  """
  publisher: [String!]!

  """
  The creation date of the record describing this manifestation in the format YYYYMMDD
  """
  recordCreationDate: String!

  """
  Series for this manifestation
  """
  series: [Series!]!
  
  """
  Universes for this manifestation
  """
  universes: [Universe!]!

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

  """
  Worktypes for this manifestations work
  """
  workTypes: [WorkTypeEnum!]!

  """
  The year this manifestation was originally published or produced
  """
  workYear: PublicationYear

  """
  id of the manifestaion unit
  """
  unit : Unit

  """
  Identification of the local id of this manifestation
  """
  localId: String

  """
  Material that can be identified as sheet music
  """
  sheetMusicCategories: SheetMusicCategory

  """
  The publication status of a catalogued manifestation.
  """
  cataloguedPublicationStatus: CataloguedPublicationStatus
}

"""
Represents the publication status of a catalogued manifestation.
"""
enum CataloguedPublicationStatusEnum {
  """
  New title
  """
  NT

  """
  New edition
  """
  NU

  """
  New print run
  """
  OP
}
type CataloguedPublicationStatus {
  """
  The code representing the catalogued publication status.
  """
  code: CataloguedPublicationStatusEnum!

  """
  The display text corresponding to the publication status code.
  """
  display: String!
}

type SheetMusicCategory {
  """
  The types of instruments material covers
  """
  instruments: [String!]!
  
  """
  I this node for exercises
  """
  forMusicalExercise: Boolean

  """
  The types of choir material covers
  """
  choirTypes: [String!]!

  """
  Material intended to practice with
  """
  musicalExercises: MusicalExercise

  """
  The types of chamber music material covers
  """
  chamberMusicTypes: [String!]!

  """
  The types of orchestra material covers
  """
  orchestraTypes: [String!]!
}

type MusicalExercise {
  """
  Information whether material is intended for practising and in combination with an instrument
  """
  forExercise: Boolean!

  """
  The types of instrument 'schools' intended to practise with
  """
  display: [String!]!
}

type Unit {
  id: String!
  manifestations: [Manifestation!]! @complexity(value: 3)
}

type ManifestationTitles {
  """
  The main title(s) of the work
  """
  main: [String!]!

  """
  The full title(s) of the manifestation including subtitles etc
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
  Titles (in other languages) parallel to the main 'title' of the manifestation
  """
  parallel: [String!]!

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
`;

export const resolvers = {
  CataloguedPublicationStatus: {
    code(parent) {
      return parent?.code?.toUpperCase?.();
    },
  },
  Audience: {
    ages(parent) {
      return parent?.ages
        ? !Array.isArray(parent?.ages)
          ? [parent.ages]
          : parent.ages
        : [];
    },
    lix(parent) {
      return parent?.lix?.display;
    },
    let(parent) {
      return parent?.let?.display;
    },
    pegi(parent) {
      return parent?.PEGI;
    },
  },
  Identifier: {
    type(parent) {
      return IDENTIFIER_TYPES.has(parent.type) ? parent.type : "NOT_SPECIFIED";
    },
  },
  ManifestationParts: {
    parts(parent) {
      return parent?.parts?.filter(
        (part) => !Object.hasOwn(part.title, "forSearchIndexOnly")
      );
    },
  },
  ManifestationPart: {
    title(parent) {
      return parent?.title?.display || "";
    },
    creators(parent) {
      if (Array.isArray(parent?.creators)) {
        return parent?.creators;
      }
      if (!parent?.creators) {
        return [];
      }

      // Handle difference in structure from JED service
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
  },
  Unit: {
    async id(parent, args, context, info) {
      return parent.unitId;
    },
    async manifestations(parent, args, context, info) {
      if (!parent.workId) {
        return [];
      }

      // manifestation unitId
      const unitId = parent.unitId;

      // Parent Work including all manifestations
      const work = await resolveWork({ id: parent?.workId }, context);
      const all = work?.manifestations.all;

      return all.map((m) => m.unitId === unitId && m).filter((p) => p);
    },
  },
  Manifestation: {
    catalogueCodes(parent) {
      return {
        nationalBibliography: parent.catalogueCodes?.nationalBibliography || [],
        otherCatalogues: parent.catalogueCodes?.otherCatalogues || [],
      };
    },
    workTypes(parent) {
      return parent?.workTypes || [];
    },
    async cover(parent, args, context, info) {
      if (parent?.pid) {
        function checkCoverImage(coverImageObject, caller) {
          if (!coverImageObject) {
            log.warn(
              `Response from ${caller} was null or undefined. The actual response was`,
              {
                unexpectedResponse: coverImageObject,
                unexpectedResponseType: typeof coverImageObject,
              }
            );
            return false;
          }

          if (typeof coverImageObject !== "object") {
            log.warn(
              `Response from ${caller} was not of type 'object'. The actual type of response was: '${typeof coverImageObject}'. The actual response was`,
              {
                unexpectedResponse: coverImageObject,
                unexpectedResponseType: typeof coverImageObject,
              }
            );
            return false;
          }

          if (Object.keys(coverImageObject)?.length < 1) {
            // Normal that response is empty, although we'd rather get a usefull response
            return false;
          }

          if (
            !coverImageObject?.hasOwnProperty("detail") ||
            !coverImageObject?.hasOwnProperty("thumbnail")
          ) {
            // Default: We know it is a non-empty object, but some fields are missing
            log.warn(
              `Response from ${caller} was a non-empty object, but somehow missing fields 'detail' and/or 'thumbnail'. The actual response was`,
              {
                unexpectedResponse: coverImageObject,
                unexpectedResponseType: typeof coverImageObject,
              }
            );
            return false;
          }

          // Response is an object with at least fields 'detail' and 'thumbnail'
          return true;
        }

        const fbiinfoCoverImage = await context.datasources
          .getLoader("fbiinfoCovers")
          .load(parent.pid);

        if (fbiinfoCoverImage?.resources?.["480px"]) {
          return {
            origin: "fbiinfo",
            detail_42: fbiinfoCoverImage?.resources?.["120px"]?.url,
            detail_117: fbiinfoCoverImage?.resources?.["120px"]?.url,
            detail_207: fbiinfoCoverImage?.resources?.["240px"]?.url,
            detail_500: fbiinfoCoverImage?.resources?.["480px"]?.url,
            detail: fbiinfoCoverImage?.resources?.["960px"]?.url,
            thumbnail: fbiinfoCoverImage?.resources?.["120px"]?.url,

            xSmall: fbiinfoCoverImage?.resources?.["120px"],
            small: fbiinfoCoverImage?.resources?.["240px"],
            medium: fbiinfoCoverImage?.resources?.["480px"],
            large: fbiinfoCoverImage?.resources?.["960px"],
          };
        }
        // }

        // Maybe the smaug client has a custom color palette
        const colors = context?.smaug?.defaultForsider?.colors;

        // no coverimage has been returned - get a default one
        const params = {
          title: parent?.titles?.main?.[0],
          materialType: parent?.materialTypes?.[0]?.general?.code,
          colors,
        };

        const defaultForsiderCoverImage = await context.datasources
          .getLoader("defaultForsider")
          .load(params);

        if (checkCoverImage(defaultForsiderCoverImage, "defaultForsider")) {
          return {
            origin: "default",
            detail_42: defaultForsiderCoverImage.thumbnail,
            detail_117: defaultForsiderCoverImage.detail,
            detail_207: defaultForsiderCoverImage.detail,
            detail_500: defaultForsiderCoverImage.detail,
            detail: defaultForsiderCoverImage.detail,
            thumbnail: defaultForsiderCoverImage.thumbnail,

            xSmall: {
              url: defaultForsiderCoverImage.thumbnail,
              width: 75,
              height: 115,
            },
            small: {
              url: defaultForsiderCoverImage.detail,
              width: 300,
              height: 460,
            },
            medium: {
              url: defaultForsiderCoverImage.detail,
              width: 300,
              height: 460,
            },
            large: {
              url: defaultForsiderCoverImage.detail,
              width: 300,
              height: 460,
            },
          };
        }
      }
      // no coverImage
      return {};
    },
    creators(parent, args, context, info) {
      if (Array.isArray(parent?.creators)) {
        return parent?.creators;
      }
      // Handle difference in structure from JED service
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
    contributors(parent, args, context, info) {
      if (Array.isArray(parent?.contributors)) {
        return parent?.contributors;
      }
      // Handle difference in structure from JED service
      return [
        ...parent?.contributors?.persons?.map((person) => ({
          ...person,
          __typename: "Person",
        })),
        ...parent?.contributors?.corporations?.map((person) => ({
          ...person,
          __typename: "Corporation",
        })),
      ];
    },

    // here is a discrepancy with fbi-api and jed-api .. FIX IT when we are allowed to
    shelfmark(parent, args, context, info) {
      if (parent?.shelfmark) {
        return {
          postfix: parent?.shelfmark?.postfix || "",
          shelfmark: parent?.shelfmark?.shelfmark || "",
        };
      }
      return null;
    },
    subjects(parent, args, context, info) {
      return {
        all: Array.isArray(parent?.subjects?.all)
          ? parent?.subjects?.all
          : parseJedSubjects(parent?.subjects?.all),
        dbcVerified: Array.isArray(parent?.subjects?.dbcVerified)
          ? parent?.subjects?.dbcVerified
          : parseJedSubjects(parent?.subjects?.dbcVerified),
      };
    },
    async ownerWork(parent, args, context, info) {
      if (parent.workId) {
        // ownerWork is not included in the JED rest endpoint (workId is used instead)
        return await resolveWork({ id: parent?.workId }, context);
      }

      // Debug error - No workId found on manifestation
      log.error("NO MANIFESTATION.WORKID FOUND in jed-presentation service", {
        pid: parent.pid,
      });

      return null;
    },

    async unit(parent, args, context, info) {
      return parent;
    },
  },
};
