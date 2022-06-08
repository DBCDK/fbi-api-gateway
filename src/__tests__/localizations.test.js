import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("localizations - get for a number of pids", async () => {
  const result = await performTestQuery({
    query: `
          query  {
          localizations(pids: ["870970-basis:29433909"]) {
            count
            agencies {
              agencyId
              holdingItems {
                localizationPid
                localIdentifier
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
