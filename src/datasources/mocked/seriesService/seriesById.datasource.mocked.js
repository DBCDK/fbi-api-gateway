export async function load({ workId }) {
  const mock = {
    seriesTitle: "De syv søstre-serien",
    seriesDescription:
      "Serie om syv adopterede søstre, der kæmper for at finde deres sande identitet efter deres elskede og excentriske fars død",
    alternativeTitles: ["De 7 søstre", "De 7 søstre-serien"],
    parallelTitles: [],
    type: "isPopular",
    workTypes: ["literature"],
    language: "dansk",
    works: [
      {
        numberInSeries: "Del 1",
        readThisFirst: true,
        persistentWorkId: "work-of:870970-basis:26521556",
      },
      {
        numberInSeries: "Del 2",
        persistentWorkId: "work-of:870970-basis:53247806",
      },
      {
        numberInSeries: "Del 3",
        persistentWorkId: "work-of:870970-basis:53557791",
      },
      {
        numberInSeries: "Del 4",
        persistentWorkId: "work-of:870970-basis:53802001",
      },
      {
        numberInSeries: "Del 5",
        persistentWorkId: "work-of:870970-basis:45942570",
      },
      {
        numberInSeries: "Del 6",
        persistentWorkId: "work-of:870970-basis:46656172",
      },
      {
        numberInSeries: "Del 7",
        persistentWorkId: "work-of:870970-basis:38500775",
      },
      {
        numberInSeries: "Del 8",
        persistentWorkId: "work-of:870970-basis:134823658",
      },
    ],
    seriesId:
      "52484af11e5beceb6340880eb9e325fa216cee2fb68c8d4f0d76029a7e255fff",
  };

  return mock;
}
