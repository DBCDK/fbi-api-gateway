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

  test("scalar serialization errors remain internal errors", () => {
    expect(() => resolvers.DateScalar.serialize("123456")).toThrow(TypeError);
  });
});
