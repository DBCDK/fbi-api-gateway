/**
 * @file - this is a test for src/schema/series::resolveSeries() function
 */

import { resolveSeries } from "../utils/utils";

test("resolve series", () => {
  const data = null;
  const parent = null;
  const actual = resolveSeries(data, parent);
  const expected = [];
  expect(actual).toEqual(expected);
});
