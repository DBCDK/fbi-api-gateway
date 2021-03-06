import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

describe("Manifestation", () => {
  test("fetch by pid", async () => {
    const result = await performTestQuery({
      query: `query ($pid: String!) {
        manifestation(pid: $pid) {
          pid 
        }
      }`,
      variables: { pid: "870970-basis:26521556" },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchSnapshot();
  });
  test("fetch by faust", async () => {
    const result = await performTestQuery({
      query: `query ($faust: String!) {
        manifestation(faust: $faust) {
          pid 
        }
      }`,
      variables: { faust: "26521556" },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchSnapshot();
  });
  test("fetch multi by pid", async () => {
    const result = await performTestQuery({
      query: `query ($pid: [String!]!) {
        manifestations(pid: $pid) {
          pid 
        }
      }`,
      variables: { pid: ["870970-basis:26521556"] },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchSnapshot();
  });
  test("fetch multi by faust", async () => {
    const result = await performTestQuery({
      query: `query ($faust: [String!]!) {
        manifestations(faust: $faust) {
          pid 
        }
      }`,
      variables: { faust: ["26521556"] },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchSnapshot();
  });
  test("Query all fields", async () => {
    const result = await performTestQuery({
      query: `query ($faust: String!) {
        manifestation(faust: $faust) {
          pid
          cover {
            thumbnail
            detail_117
            detail_207
            detail_42
            detail_500
            detail
          }
          titles {
            main
            full
            sort
            alternative
            identifyingAddition
            original
            parallel
            standard
            translated
          }
          abstract
          accessTypes {
            display
            code
          }
          access {
            __typename
            ... on AccessUrl {
              origin
              url
            }
            ... on Ereol {
              origin
              url
              canAlwaysBeLoaned
            }
            ... on InterLibraryLoan {
              loanIsPossible
            }
            ... on InfomediaService {
              id
            }
            ... on DigitalArticleService {
              issn
            }
          }
          audience {
            generalAudience
            ages {
              begin
              end
              display
            }
            libraryRecommendation
            childrenOrAdults {
              display
              code
            }
            schoolUse {
              display
              code
            }
            primaryTarget
            let
            lix
          }
          catalogueCodes {
            nationalBibliography
            otherCatalogues
          }
          contributors {
            display
            nameSort
          }
          contributorsFromDescription
          creators {
            display
            nameSort
          }
          creatorsFromDescription
          classifications {
            code
            display
            entryType
            system
          }
          edition {
            summary
            edition
            contributors
            publicationYear {
              display
              year
              endYear
              frequency
            }
          }
          latestPrinting {
            summary
            printing
            publicationYear {
              display
            }
          }
          genreAndForm
          hostPublication {
            title
            creator
            issn
            isbn
            issue
            notes
            pages
            publisher
            series {
              title
            }
            year {
              display
            }
            summary
          }
          identifiers {
            type
            value
          }
          languages {
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
            abstract {
              display
              isoCode
            }
          }
          manifestationParts {
            heading
            parts {
              title
              creators {
                display
              }
              classifications {
                code
              }
              subjects {
                display
              }
              creatorsFromDescription
            }
            type
          }
          materialTypes {
            general
            specific
          }
          notes {
            type
            heading
            display
          }
          relatedPublications {
            heading
            title
            issn
            isbn
            urlText
            url
          }
          physicalDescriptions {
            summary
            accompanyingMaterial
            additionalDescription
            extent
            numberOfPages
            numberOfUnits
            playingTime
            requirements
            size
            technicalInformation
          }
          publicationYear {
            display
          }
          publisher
          series {
            title
            alternativeTitles
            parallelTitles
            numberInSeries {
              display
              number
            }
            readThisFirst
            readThisWhenever
            isPopular
          }
          shelfmark {
            postfix
            shelfmark
          }
          source
          subjects {
            all {
              display
            }
            dbcVerified {
              display
            }
          }
          volume
          tableOfContents {
            heading
            content
            listOfContent {
              content
            }
          }
        }
      }`,
      variables: { faust: "26521556" },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchSnapshot();
  });
});
