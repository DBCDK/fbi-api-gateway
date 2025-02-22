import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

describe("Work", () => {
  test("fetch by id", async () => {
    const result = await performTestQuery({
      query: `query ($id: String!) {
        work(id: $id) {
          workId 
        }
      }`,
      variables: { id: "work-of:870970-basis:26521556" },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchSnapshot();
  });
  test("fetch by pid", async () => {
    const result = await performTestQuery({
      query: `query ($pid: String!) {
        work(pid: $pid) {
          workId 
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
        work(faust: $faust) {
          workId 
        }
      }`,
      variables: { faust: "26521556" },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchSnapshot();
  });
  test("fetch multi by id", async () => {
    const result = await performTestQuery({
      query: `query ($id: [String!]!) {
        works(id: $id) {
          workId 
        }
      }`,
      variables: { id: ["work-of:870970-basis:26521556"] },
      context: { datasources: createMockedDataLoaders() },
    });
    expect(result).toMatchSnapshot();
  });
  test("fetch multi by pid", async () => {
    const result = await performTestQuery({
      query: `query ($pid: [String!]!) {
        works(pid: $pid) {
          workId 
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
        works(faust: $faust) {
          workId 
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
        work(faust: $faust) {
          workId
          titles {
            main
            full
            parallel
            sort
            original
            standard
            translated
          }
          abstract
          creators {
            display
            nameSort
          }
          dk5MainEntry {
            display
            code
            dk5Heading
          }
          fictionNonfiction {
            display
            code
          }
          materialTypes {
            materialTypeGeneral {
              code
              display
            }
            materialTypeSpecific {
              code
              display
            }
          }
          series {
            title
            alternativeTitles
            parallelTitles
            numberInSeries
            readThisFirst
            readThisWhenever
            isPopular
          }
          universes {
            title
          }
          subjects {
            all {
              display
            }
            dbcVerified {
              display
            }
          }
          genreAndForm
          workTypes
          workYear {
            display
            year
            endYear
            frequency
          }
          mainLanguages {
            display
            isoCode
          }
          manifestations {
            bestRepresentation {
              pid
            }
            mostRelevant {
              pid
            }
            first {
              pid
            }
            latest {
              pid
            }
            all {
              pid
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
