import { filterAgenciesByProps } from "../accounts";

describe("filterAgenciesByProps", () => {
  test("returns one preferred account per agency with LOCAL fallback", () => {
    const agencies = [
      { agencyId: "710100", userId: "cpr-1", userIdType: "CPR" },
      { agencyId: "710100", userId: "cpr-2", userIdType: "CPR" },
      { agencyId: "710100", userId: "local-1", userIdType: "LOCAL" },
      { agencyId: "715100", userId: "local-2", userIdType: "LOCAL" },
    ];

    expect(
      filterAgenciesByProps(agencies, {
        type: "CPR",
        useLocalFallbackForUnrepresentedAgencies: true,
        limitToOneAccountPerAgency: true,
      })
    ).toEqual([
      { agencyId: "710100", userId: "cpr-1", userIdType: "CPR" },
      { agencyId: "715100", userId: "local-2", userIdType: "LOCAL" },
    ]);
  });

  test("does not deduplicate accounts unless requested", () => {
    const agencies = [
      { agencyId: "710100", userId: "cpr-1", userIdType: "CPR" },
      { agencyId: "710100", userId: "cpr-2", userIdType: "CPR" },
    ];

    expect(filterAgenciesByProps(agencies, { type: "CPR" })).toEqual(agencies);
  });
});
