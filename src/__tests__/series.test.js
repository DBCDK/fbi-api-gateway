import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("series - get series from workId", async () => {
  const result = await performTestQuery({
    query: `
          query Example_WorkSeries($workId: String!) {
            work(id: $workId) {
              series {
                title
                numberInSeries
                readThisFirst
                readThisWhenever
                members {
                  numberInSeries
                  work {
                    workId
                  }
                }
              }
            }
          }
        `,
    variables: {
      workId: "work-of:870970-basis:38500775",
    },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});
