/**
 * @file GraphQL tests for the refWorks query
 */
import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

const query = `
  query ($pids: [String!]!) {
    refWorks(pids: $pids)
  }
`;

test("refWorks returns a single record", async () => {
  const result = await performTestQuery({
    query,
    variables: { pids: ["870970-basis:55132194"] },
    context: { datasources: createMockedDataLoaders() },
  });

  expect(result).toEqual({
    data: {
      refWorks:
        "RT Book, Whole\nT1 Børnegrisene og det mega store monster\n",
    },
  });
});

test("refWorks joins records and omits missing pids", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      pids: [
        "870970-basis:55132194",
        "missing-pid",
        "870970-basis:26521556",
      ],
    },
    context: { datasources: createMockedDataLoaders() },
  });

  expect(result).toEqual({
    data: {
      refWorks:
        "RT Book, Whole\nT1 Børnegrisene og det mega store monster\n\nRT Book, Whole\nT1 Some other title\n",
    },
  });
});
