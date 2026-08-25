import { GALE_AGENCY_CONFIG } from "../galeAgencyConfig";

const GALE_SOURCE_IDENTIFIERS = [
  "150023-glicon",
  "150023-biocon",
  "150023-stucon",
  "150023-sicref",
  "150023-litres",
  "150023-gsex",
];

describe("GALE_AGENCY_CONFIG", () => {
  test("grants GSEX access to exactly the configured agencies", () => {
    const agenciesWithGsexAccess = Object.entries(GALE_AGENCY_CONFIG)
      .filter(([, config]) => config.accessTo.includes("150023-gsex"))
      .map(([agencyId]) => agencyId);

    expect(agenciesWithGsexAccess).toEqual(
      expect.arrayContaining([
        "710100",
        "714700",
        "716900",
        "718500",
        "739000",
        "741000",
        "746100",
        "747900",
        "753000",
        "765700",
        "774000",
        "775100",
        "778700",
      ])
    );
    expect(agenciesWithGsexAccess).toHaveLength(13);
  });

  test("only contains known sources without duplicates", () => {
    Object.values(GALE_AGENCY_CONFIG).forEach(({ accessTo }) => {
      expect(
        accessTo.every((source) => GALE_SOURCE_IDENTIFIERS.includes(source))
      ).toBe(true);
      expect(new Set(accessTo).size).toBe(accessTo.length);
    });
  });
});
