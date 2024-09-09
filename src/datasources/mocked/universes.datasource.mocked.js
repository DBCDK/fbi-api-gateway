export async function load() {
  const mock = {
    universes: [
      {
        universeTitle: "Some universe",
        alternativeTitles: [],
        universeDescription: "Some universe description",
        content: [
          {
            seriesTitle: "Universe title",
            identifyingAddition: "universe movie",
            alternativeTitles: ["some alternative universe title"],
            parallelTitles: [],
            type: "isPopular",
            workTypes: ["music", "movie"],
            language: "engelsk",
            works: [
              {
                numberInSeries: "Del 1",
                persistentWorkId: "work-of:something",
              },
            ],
          },
        ],
        workTypes: [
          "GAME",
          "MOVIE",
          "LITERATURE",
          "OTHER",
          "MUSIC",
          "SHEETMUSIC",
        ],
      },
    ],
  };

  return mock;
}
