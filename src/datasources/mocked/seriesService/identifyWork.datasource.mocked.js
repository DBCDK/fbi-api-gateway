/**
 * @file - mocked datasource - get a series
 * @param workId
 * @returns {Promise<{series: [{id: string, numberInSeries: string, title: string}]}>}
 */
export async function load({ workId }) {
  const mock = {
    series: [{ id: "1", numberInSeries: "1", title: "De syv søstre-serien" }],
  };
  return mock;
}
