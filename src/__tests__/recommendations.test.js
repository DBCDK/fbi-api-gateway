import { performTestQuery } from "../utils/utils";
import { createMockedDataLoaders } from "../datasourceLoader";

const query = `
query Example_WorkRecommendations($pid: String!, $limit: Int!) {
  recommend(pid: $pid, limit: $limit) {
    result {
      work {
        workId
      }
      manifestation {
        pid
      }
    }
  }
}  
`;

test("Check return without null", async () => {
  const limit = 3;
  const result = await performTestQuery({
    query,
    variables: {
      pid: "check_no_null",
      limit: limit,
    },
    context: {
      datasources: createMockedDataLoaders(),
    },
  });

  const expected = [
    {
      work: { workId: "work-of:870970-basis:46310039" },
      manifestation: { pid: "870970-basis:46310039" },
    },
    {
      work: { workId: "work-of:870970-basis:05245796" },
      manifestation: { pid: "870970-basis:05245796" },
    },
    {
      work: { workId: "work-of:870970-basis:54958897" },
      manifestation: { pid: "870970-basis:54958897" },
    },
  ];

  expect(result.data.recommend.result.length).toEqual(limit);
  expect(result.data.recommend.result).toEqual(expected);
});

test("should remove first element (is null) fill in extra limit (to 3)", async () => {
  const limit = 3;
  const result = await performTestQuery({
    query,
    variables: {
      pid: "check_with_nulls_should_be_removed",
      limit: limit,
    },
    context: {
      datasources: createMockedDataLoaders(),
    },
  });

  const expected = [
    {
      work: { workId: "work-of:870970-basis:05245796" },
      manifestation: { pid: "870970-basis:05245796" },
    },
    {
      work: { workId: "work-of:870970-basis:54958897" },
      manifestation: { pid: "870970-basis:54958897" },
    },
    {
      work: { workId: "work-of:870970-basis:46442938" },
      manifestation: { pid: "870970-basis:46442938" },
    },
  ];

  expect(result.data.recommend.result.length).toEqual(limit);
  expect(result.data.recommend.result).toEqual(expected);
});

test("should return 1 less than limit, when not enough extra", async () => {
  const limit = 3;
  const result = await performTestQuery({
    query,
    variables: {
      pid: "check_with_too_many_nulls",
      limit: limit,
    },
    context: {
      datasources: createMockedDataLoaders(),
    },
  });

  const expected = [
    {
      work: { workId: "work-of:870970-basis:46310039" },
      manifestation: { pid: "870970-basis:46310039" },
    },
    {
      work: { workId: "work-of:870970-basis:05245796" },
      manifestation: { pid: "870970-basis:05245796" },
    },
  ];

  expect(result.data.recommend.result.length).toEqual(limit - 1);
  expect(result.data.recommend.result).toEqual(expected);
});
