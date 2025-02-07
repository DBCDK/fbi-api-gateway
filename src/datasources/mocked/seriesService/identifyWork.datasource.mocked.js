/**
 * @file - mocked datasource - get a series
 * @param workId
 * @returns {Promise<{series: [{id: string, numberInSeries: string, title: string}]}>}
 */
export async function load({ workId }) {
  const mock = {
    trackingId: "1362f3da-5b7e-40fb-be6e-bd4f13735f6d",
    series: [
      {
        id: "52484af11e5beceb6340880eb9e325fa216cee2fb68c8d4f0d76029a7e255fff",
        title: "De syv søstre-serien",
      },
    ],
  };

  //   {
  //   series: [{ id: "1", numberInSeries: "1", title: "De syv søstre-serien" }],
  // };
  return mock;
}

export { teamLabel };
