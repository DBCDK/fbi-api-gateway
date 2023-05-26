export async function load({ workId }) {
  const mock = {
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
            persistentWorkId: "work-of:870970-basis:52557240",
          },
          {
            numberInSeries: "2",
            persistentWorkId: "work-of:870970-basis:52970628",
          },
          {
            numberInSeries: "3",
            persistentWorkId: "work-of:870970-basis:53280749",
          },
          {
            numberInSeries: "4",
            persistentWorkId: "work-of:870970-basis:53802001",
          },
          {
            numberInSeries: "5",
            persistentWorkId: "work-of:870970-basis:54189141",
          },
          {
            numberInSeries: "6",
            persistentWorkId: "work-of:870970-basis:46656172",
          },
          {
            numberInSeries: "7",
            persistentWorkId: "work-of:870970-basis:38500775",
          },
          {
            numberInSeries: "8",
            persistentWorkId: "work-of:870970-basis:134823658",
          },
        ],
      },
    ],
    trackingId: "46951e24-92c1-4194-9165-e1fde6e95c54",
  };

  return mock;
}
