import { getPageDescription } from "../utils";

describe("Utils", () => {
  test("getPageDescription", () => {
    const work = {
      id: "some-work-id",
      title: "en Bogtitel",
      creators: [{ name: "En Forfatter" }],
      materialTypes: [
        { materialType: "Bog" },
        { materialType: "eBog" },
        { materialType: "lydBog" }
      ]
    };
    const actual = getPageDescription(work);
    const expected =
      "Lån en Bogtitel af En Forfatter som bog, ebog eller lydbog. Bestil, reserver, lån fra alle danmarks biblioteker. Afhent på dit lokale bibliotek eller find online.";
    expect(actual).toEqual(expected);
  });

  test("getPageDescription - one valid type", () => {
    const work = {
      id: "some-work-id",
      title: "en Bogtitel",
      creators: [{ name: "En Forfatter" }],
      materialTypes: [{ materialType: "lydbog" }]
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
      materialTypes: [{ materialType: "diskette" }]
    };
    const actual = getPageDescription(work);
    const expected =
      "Lån en Bogtitel af En Forfatter. Bestil, reserver, lån fra alle danmarks biblioteker. Afhent på dit lokale bibliotek eller find online.";
    expect(actual).toEqual(expected);
  });
});
