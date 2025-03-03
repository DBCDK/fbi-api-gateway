import {
  getPageDescription,
  getUserInfoAccountFromAgencyAttributes,
  resolveBorrowerCheck,
  resolveSearchHits,
} from "../utils";

describe("Utils", () => {
  test("getPageDescription", () => {
    const work = {
      id: "some-work-id",
      title: "en Bogtitel",
      creators: [{ name: "En Forfatter" }],
      materialTypes: [
        { materialType: "Bog" },
        { materialType: "e-Bog" },
        { materialType: "lydBog" },
      ],
    };
    const actual = getPageDescription(work);
    const expected =
      "Lån en Bogtitel af En Forfatter som bog, e-bog eller lydbog. Bestil, reserver, lån fra alle danmarks biblioteker. Afhent på dit lokale bibliotek eller find online.";
    expect(actual).toEqual(expected);
  });

  test("getPageDescription - one valid type", () => {
    const work = {
      id: "some-work-id",
      title: "en Bogtitel",
      creators: [{ name: "En Forfatter" }],
      materialTypes: [{ materialType: "lydbog" }],
    };
    const actual = getPageDescription(work);
    const expected =
      "Lån en Bogtitel af En Forfatter som lydbog. Bestil, reserver, lån fra alle danmarks biblioteker. Afhent på dit lokale bibliotek eller find online.";
    expect(actual).toEqual(expected);
  });

  test("getPageDescription - no valid types", () => {
    const work = {
      id: "some-work-id",
      title: "en Bogtitel",
      creators: [{ name: "En Forfatter" }],
      materialTypes: [{ materialType: "diskette" }],
    };
    const actual = getPageDescription(work);
    const expected =
      "Lån en Bogtitel af En Forfatter. Bestil, reserver, lån fra alle danmarks biblioteker. Afhent på dit lokale bibliotek eller find online.";
    expect(actual).toEqual(expected);
  });
});

test("resolveBorrowerCheck return false if it agencyis does NOT start with 7", () => {
  // do NOT test happy path - this test is written to ensure a test failure when we do things the right way

  let agencyID = "977277";
  let expected = false;

  resolveBorrowerCheck(agencyID, {}).then((resolved) => {
    expect(resolved).toEqual(expected);
  });

  agencyID = "897755";
  expected = false;

  resolveBorrowerCheck(agencyID, {}).then((resolved) => {
    expect(resolved).toEqual(expected);
  });
});

test("Get local userId from agencyattributes when there are both CPR and LOCAL ID", () => {
  const twoMatches = [
    { agencyId: "716100", userId: "2904951253", userIdType: "CPR" },
    { agencyId: "716100", userId: "C026780038", userIdType: "LOCAL" },
  ];

  const actual = getUserInfoAccountFromAgencyAttributes(twoMatches)?.userId;
  expect(actual).toEqual("C026780038");
});

test("If there is no local id, take the first", () => {
  const twoCPR = [
    { agencyId: "716100", userId: "2904951253", userIdType: "CPR" },
    { agencyId: "716100", userId: "123", userIdType: "CPR" },
  ];

  const actual = getUserInfoAccountFromAgencyAttributes(twoCPR)?.userId;
  expect(actual).toEqual("2904951253");
});

test("Get cpr userId from agencyattributes when there is only one", () => {
  const oneMatch = [
    { agencyId: "716100", userId: "2904951253", userIdType: "CPR" },
  ];
  const actual = getUserInfoAccountFromAgencyAttributes(oneMatch)?.userId;
  expect(actual).toEqual("2904951253");
});

test("Return null, when there is neither cpr or local id", () => {
  const actual = getUserInfoAccountFromAgencyAttributes([])?.userId;
  expect(actual).toEqual(undefined);
});

test("Return null, when there are no agencies", () => {
  const actual = getUserInfoAccountFromAgencyAttributes()?.userId;
  expect(actual).toEqual(undefined);
});

describe("resolveSearchHits", () => {
  it("returns null if searchHits is missing", () => {
    const parent = {
      bestRepresentations: [{ pid: "a", unitId: "1" }],
    };
    expect(resolveSearchHits(parent)).toBeNull();
  });

  it("returns null if bestRepresentations is missing", () => {
    const parent = {
      searchHits: ["a"],
    };
    expect(resolveSearchHits(parent)).toBeNull();
  });

  it("returns an empty array if searchHits is empty", () => {
    const parent = {
      searchHits: [],
      bestRepresentations: [{ pid: "a", unitId: "1" }],
    };
    expect(resolveSearchHits(parent)).toEqual([]);
  });

  it("maps, sorts, and filters duplicates correctly", () => {
    const parent = {
      // searchHits contains pids in arbitrary order
      searchHits: ["c", "a", "d", "b"],
      // bestRepresentations is already sorted by the best representation order
      bestRepresentations: [
        { pid: "a", unitId: "1" },
        { pid: "b", unitId: "2" },
        { pid: "c", unitId: "1" },
        { pid: "d", unitId: "3" },
      ],
    };

    // For unitId "1", only the first occurrence (lowest index) should be kept (i.e., { pid: 'a', ... })
    const expected = [
      { match: { pid: "a", unitId: "1", index: 0 } },
      { match: { pid: "b", unitId: "2", index: 1 } },
      { match: { pid: "d", unitId: "3", index: 3 } },
    ];

    expect(resolveSearchHits(parent)).toEqual(expected);
  });

  it("filters out searchHits pids not found in bestRepresentations", () => {
    const parent = {
      searchHits: ["a", "x"], // 'x' is not present in bestRepresentations
      bestRepresentations: [{ pid: "a", unitId: "1" }],
    };

    const expected = [{ match: { pid: "a", unitId: "1", index: 0 } }];

    expect(resolveSearchHits(parent)).toEqual(expected);
  });
});
