import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("localizations - get for a number of pids", async () => {
  const result = await performTestQuery({
    query: `
          query  {
            work(id: "work-of:870970-basis:47051649") {
              materialTypes {          
                localizations{
                  count
                  agencies{
                  agencyId
                    holdingItems{
                      localizationPid
                      localIdentifier
                      codes
                    }
                  }
                }
              }
            }
          }
        `,
    variables: {},
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});
