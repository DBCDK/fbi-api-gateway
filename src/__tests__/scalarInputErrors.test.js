import { GraphQLError, Kind } from "graphql";
import { schemaLoader } from "../schemaLoader";

describe("custom scalar input errors", () => {
  const { resolvers } = schemaLoader();

  test.each(["DateScalar", "DateTimeScalar"])(
    "%s reports invalid variable input as a GraphQL client error",
    (scalarName) => {
      expect.assertions(3);

      try {
        resolvers[scalarName].parseValue("123456");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect(error.extensions?.code).toBe("BAD_USER_INPUT");
        expect(error.message).toMatch(/cannot represent/i);
      }
    }
  );

  test("invalid inline Date input is also a GraphQL client error", () => {
    expect(() =>
      resolvers.DateScalar.parseLiteral({
        kind: Kind.STRING,
        value: "123456",
      })
    ).toThrow(GraphQLError);
  });

  test.each([
    "2026-07-02T00:30:00",
    "2026-07-02T00:30:00.1234Z",
    "2026-02-30T00:30:00Z",
  ])("historical timestamp rejects invalid input %s", (value) => {
    const scalar = resolvers.HistoricalLoanTimestampScalar;
    expect(() => scalar.parseValue(value)).toThrow(GraphQLError);
    expect(() => scalar.parseLiteral({ kind: Kind.STRING, value })).toThrow(
      GraphQLError
    );
  });

  test("historical timestamp accepts offsets and normalizes to UTC", () => {
    expect(
      resolvers.HistoricalLoanTimestampScalar.parseValue(
        "2026-07-02T00:30:00+02:00"
      )
    ).toEqual(new Date("2026-07-01T22:30:00Z"));
  });

  test("scalar serialization errors remain internal errors", () => {
    expect(() => resolvers.DateScalar.serialize("123456")).toThrow(TypeError);
  });
});
