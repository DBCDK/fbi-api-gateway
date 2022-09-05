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
            functionCode
          }
          romanNumeral
        }
        subjects {
          display
          language
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
            functionCode
          }
          romanNumeral
        }
        subjects {
          display
          language
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
}`;

const MANIFESTATION_FIELDS_FRAGMENT = `fragment manifestationFields on JedManifestation
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
    catalogueCodes {
      nationalBibliography
      otherCatalogues
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
      schema_org
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
          language
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
          language
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
    manifestationTypes
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
    publicationYear {
      display
      endYear
      frequency
      year
    }
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
`;
