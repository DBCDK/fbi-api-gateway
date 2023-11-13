/**
 * @file - this is a test for src/schema/series::resolveSeries() function
 */

import { resolveSeries } from "../utils/utils";

describe("resolve series", () => {
  test("Select fields from specific member (workId) and add to series level", () => {
    const data = {
      series: [
        {
          seriesTitle: "De syv søstre-serien",
          seriesDescription:
            "Serie om syv adopterede søstre, der kæmper for at finde deres sande identitet efter deres elskede og excentriske fars død",
          alternativeTitles: [],
          parallelTitles: [],
          works: [
            {
              numberInSeries: "1",
              readThisFirst: true,
              persistentWorkId: "work-of:870970-basis:26521556",
            },
            {
              numberInSeries: "2",
              persistentWorkId: "work-of:870970-basis:52970628",
            },
            {
              numberInSeries: "3",
              persistentWorkId: "work-of:870970-basis:53280749",
            },
          ],
        },
      ],
      trackingId: "46951e24-92c1-4194-9165-e1fde6e95c54",
    };

    const parent = { workId: "work-of:870970-basis:26521556" };
    const actual = resolveSeries(data, parent);
    const expected = [
      {
        numberInSeries: "1",
        readThisFirst: true,
        readThisWhenever: null,
        seriesTitle: "De syv søstre-serien",
        seriesDescription:
          "Serie om syv adopterede søstre, der kæmper for at finde deres sande identitet efter deres elskede og excentriske fars død",
        alternativeTitles: [],
        parallelTitles: [],
        works: [
          {
            numberInSeries: "1",
            readThisFirst: true,
            persistentWorkId: "work-of:870970-basis:26521556",
          },
          {
            numberInSeries: "2",
            persistentWorkId: "work-of:870970-basis:52970628",
          },
          {
            numberInSeries: "3",
            persistentWorkId: "work-of:870970-basis:53280749",
          },
        ],
      },
    ];

    expect(actual).toEqual(expected);
  });
});
