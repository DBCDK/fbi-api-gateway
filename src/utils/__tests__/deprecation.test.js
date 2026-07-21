import {
  getDeprecationReasonFromDirectives,
  getDraftDetails,
  hasDeprecatedDirective,
  isDraftDeprecated,
  isDraftReason,
  isTrueDeprecated,
} from "../deprecation";

function createDeprecatedDirective(reason = "use another field expires: 31/12-2099") {
  return {
    kind: "Directive",
    name: {
      kind: "Name",
      value: "deprecated",
    },
    arguments: [
      {
        kind: "Argument",
        name: {
          kind: "Name",
          value: "reason",
        },
        value: {
          kind: "StringValue",
          value: reason,
        },
      },
    ],
  };
}

describe("deprecation utils", () => {
  test("detects deprecated directives and extracts reason", () => {
    const directives = [createDeprecatedDirective("@draft: under evaluation")];

    expect(hasDeprecatedDirective(directives)).toBe(true);
    expect(getDeprecationReasonFromDirectives(directives)).toBe(
      "@draft: under evaluation"
    );
  });

  test("detects draft reasons and returns optional details", () => {
    expect(isDraftReason("@draft")).toBe(true);
    expect(isDraftReason("@draft: internal")).toBe(true);
    expect(getDraftDetails("@draft")).toBeNull();
    expect(getDraftDetails("@draft: internal")).toBe("internal");
  });

  test("distinguishes draft and true deprecated introspection entries", () => {
    expect(
      isDraftDeprecated({
        isDeprecated: true,
        deprecationReason: "@draft",
      })
    ).toBe(true);

    expect(
      isTrueDeprecated({
        isDeprecated: true,
        deprecationReason: "use another field expires: 31/12-2099",
      })
    ).toBe(true);

    expect(
      isTrueDeprecated({
        isDeprecated: true,
        deprecationReason: "@draft",
      })
    ).toBe(false);
  });
});
