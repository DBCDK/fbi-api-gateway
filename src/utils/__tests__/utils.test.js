import {
  getPageDescription,
  getUserInfoAccountFromAgencyAttributes,
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
