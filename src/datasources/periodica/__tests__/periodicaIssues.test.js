const { sortIssues } = require("../periodicaIssues.datasource"); // Tilpas sti ved behov

describe("sortIssues", () => {
  test("sorts a mixed list of date/year/volume/issue strings in correct order", () => {
    const input = [
      "2022-01-01",
      "2023-01-01",
      "2023-05-01",
      "(1979)",
      "1980",
      "9,16,26.2. (1973)",
      "årg. 70, nr. 49 (1980)",
      "årg. 70, nr. 49 (2022)",
      "jylp 15. 4.",
      "2020-05-01",
      "årg. 1010, nr. 1200 (1980)",
    ];

    const sorted = [...input].sort(sortIssues);

    expect(sorted).toEqual([
      "2023-05-01",
      "2023-01-01", // dato først
      "årg. 70, nr. 49 (2022)",
      "2022-01-01",
      "2020-05-01",
      "årg. 1010, nr. 1200 (1980)",
      "årg. 70, nr. 49 (1980)",
      "1980",
      "(1979)",
      "9,16,26.2. (1973)",
      "jylp 15. 4.",
    ]);
  });
});
