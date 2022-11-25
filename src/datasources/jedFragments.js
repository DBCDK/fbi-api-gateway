export const WORK_FIELDS_FRAGMENT = `fragment workFields on JedWork {
    __typename
    abstract
    dk5MainEntry {
      code
      display
    }
    fictionNonfiction {
      code
      display
    }
    genreAndForm
    mainLanguages {
      display
      isoCode
    }
    materialTypes {
      general
      specific
    }
    series {
      alternativeTitles
      isPopular
      numberInSeries {
        display
        number
      }
      parallelTitles
      readThisFirst
      readThisWhenever
      title
    }
    universe {
      title
    }
    creators {
      corporations {
        __typename
        attributeToName
        type
        display
        location
        main
        nameSort
        number
        roles {
          function {
            plural
            singular
          }
          functionCode
        }
        sub
        year
      }
      persons {
        __typename
        aliases {
          aliases {
            attributeToName
            birthYear
            display
            firstName
            lastName
            nameSort
            type
            romanNumeral
          }
          attributeToName
          birthYear
          display
          firstName
          lastName
          nameSort
          type
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          romanNumeral
        }
        attributeToName
        birthYear
        display
        firstName
        lastName
        nameSort
        type
        roles {
          function {
            plural
            singular
          }
          functionCode
        }
        romanNumeral
      }
    }
    workId
    subjects {
      all {
        corporations {
          attributeToName
          type
          display
          location
          main
          nameSort
          number
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          sub
          year
        }
        persons {
          aliases {
            attributeToName
            birthYear
            display
            firstName
            lastName
            nameSort
            type
            romanNumeral
          }
          attributeToName
          birthYear
          display
          firstName
          lastName
          nameSort
          type
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          romanNumeral
        }
        subjects {
          display
          language {
            display
            isoCode
          }
          type
        }
        timePeriods {
          begin
          display
          end
          type
        }
      }
      dbcVerified {
        corporations {
          attributeToName
          type
          display
          location
          main
          nameSort
          number
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          sub
          year
        }
        persons {
          aliases {
            attributeToName
            birthYear
            display
            firstName
            lastName
            nameSort
            type
            romanNumeral
          }
          attributeToName
          birthYear
          display
          firstName
          lastName
          nameSort
          type
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          romanNumeral
        }
        subjects {
          display
          language {
            display
            isoCode
          }
          type
        }
        timePeriods {
          begin
          display
          end
          type
        }
      }
    }
    titles {
      full
      main
      original
      parallel
      sort
      standard
      translated
    }
    workTypes
    workYear
    relations {
      continuedIn
      continues
      discussedIn
      discusses
      hasAdaptation
      hasAnalysis
      hasCreatorDescription
      hasDescriptionFromPublisher
      hasManuscript
      hasReusedReview
      hasReview
      hasSoundtrack
      isAdaptationOf
      isAnalysisOf
      isDescriptionFromPublisherOf
      isManuscriptOf
      isReusedReviewOf
      isReviewOf
      isSoundtrackOfGame
      isSoundtrackOfMovie
      hasTrack
      isPartOfAlbum
      isPartOfManifestation
    }
}`;

export const MANIFESTATION_FIELDS_FRAGMENT = `fragment manifestationFields on JedManifestation {
    abstract
    accessTypes {
      code
      display
    }
    access {
      accessUrl {
        note
        origin
        url
      }
      dbcWebArchive
      digitalArticleService {
        issn
      }
      ereol {
        canAlwaysBeLoaned
        note
        origin
        url
      }
      infomediaService {
        id
      }
      interLibraryLoanIsPossible
      openUrl
    }
    audience {
      ages {
        begin
        display
        end
        type
      }
      childrenOrAdults {
        code
        display
      }
      generalAudience
      let
      libraryRecommendation
      lix
      primaryTarget
      schoolUse {
        code
        display
      }
    }
    classifications {
      code
      display
      entryType
      system
    }
    collectionIdentifiers
    contributors {
      corporations {
        attributeToName
        type
        display
        location
        main
        nameSort
        number
        sub
        year
        roles {
          function {
            plural
            singular
          }
          functionCode
        }
      }
      persons {
        attributeToName
        birthYear
        display
        firstName
        lastName
        nameSort
        type
        romanNumeral
        roles {
          function {
            plural
            singular
          }
          functionCode
        }
      }
    }
    contributorsFromDescription
    creatorsFromDescription
    edition {
      contributors
      edition
      publicationYear {
        display
        endYear
        frequency
        year
      }
      summary
    }
    fictionNonfiction {
      code
      display
    }
    genreAndForm
    hostPublication {
      creator
      isbn
      issn
      issue
      edition
      notes
      pages
      publisher
      series {
        alternativeTitles
        isPopular
        parallelTitles
        readThisFirst
        readThisWhenever
        title
      }
      summary
      title
      year {
        display
        endYear
        frequency
        year
      }
    }
    identifiers {
      type
      value
    }
    languages {
      abstract {
        display
        isoCode
      }
      main {
        display
        isoCode
      }
      original {
        display
        isoCode
      }
      parallel {
        display
        isoCode
      }
      spoken {
        display
        isoCode
      }
      subtitles {
        display
        isoCode
      }
    }
    latestPrinting {
      printing
      publicationYear {
        display
        endYear
        frequency
        year
      }
      summary
      publisher
    }
    creators {
      corporations {
        attributeToName
        type
        display
        location
        main
        nameSort
        number
        sub
        year
        roles {
          function {
            plural
            singular
          }
          functionCode
        }
      }
      persons {
        attributeToName
        birthYear
        display
        firstName
        lastName
        nameSort
        type
        romanNumeral
        roles {
          function {
            plural
            singular
          }
          functionCode
        }
      }
    }
    manifestationParts {
      heading
      type
      parts {
        creatorsFromDescription
        title
      }
    }
    subjects {
      all {
        corporations {
          type
          display
          location
          main
          nameSort
          number
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          sub
          year
        }
        persons {
          display
          attributeToName
          birthYear
          firstName
          lastName
          nameSort
          type
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          romanNumeral
        }
        subjects {
          display
          language {
            display
            isoCode
          }
          type
        }
      }
      dbcVerified {
        corporations {
          type
          display
          location
          main
          nameSort
          number
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          sub
          year
        }
        persons {
          display
          attributeToName
          birthYear
          firstName
          lastName
          nameSort
          type
          roles {
            function {
              plural
              singular
            }
            functionCode
          }
          romanNumeral
        }
        subjects {
          display
          language {
            display
            isoCode
          }
          type
        }
      }
    }
    titles {
      alternative
      full
      identifyingAddition
      main
      original
      parallel
      sort
      standard
      translated
    }
    materialTypes {
      general
      specific
    }
    notes {
      display
      heading
      type
    }
    physicalDescriptions {
      accompanyingMaterial
      additionalDescription
      extent
      numberOfPages
      numberOfUnits
      playingTime
      requirements
      size
      summary
      technicalInformation
      textVsIllustrations
    }
    pid
    publisher
    recordCreationDate
    relatedPublications {
      heading
      isbn
      issn
      title
      url
      urlText
    }
    series {
      alternativeTitles
      isPopular
      numberInSeries {
        display
        number
      }
      parallelTitles
      readThisFirst
      readThisWhenever
      title
    }
    shelfmark {
      postfix
      shelfmark
    }
    source
    tableOfContents {
      content
      heading
      listOfContent {
        content
        heading
      }
    }
    volume
    workTypes
    workYear
    relations {
      continuedIn
      continues
      discussedIn
      discusses
      hasAdaptation
      hasAnalysis
      hasCreatorDescription
      hasDescriptionFromPublisher
      hasManuscript
      hasReusedReview
      hasReview
      hasSoundtrack
      isAdaptationOf
      isAnalysisOf
      isDescriptionFromPublisherOf
      isManuscriptOf
      isReusedReviewOf
      isReviewOf
      isSoundtrackOfGame
      isSoundtrackOfMovie
      hasTrack
      isPartOfAlbum
      isPartOfManifestation
    }
  }
`;
