import { GraphQLScalarType, Kind } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { badUserInput } from "./utils";

function parseTimestamp(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/i.test(
      value
    )
  ) {
    throw badUserInput(
      "Historical loan timestamps require RFC 3339 with an explicit timezone and at most three fractional digits"
    );
  }
  try {
    return DateTimeResolver.parseValue(value);
  } catch (error) {
    throw badUserInput(error.message);
  }
}

export const typeDef = `
  """RFC 3339 timestamp with an explicit timezone and at most millisecond precision."""
  scalar HistoricalLoanTimestampScalar
`;

export const resolvers = {
  HistoricalLoanTimestampScalar: new GraphQLScalarType({
    name: "HistoricalLoanTimestampScalar",
    serialize: DateTimeResolver.serialize,
    parseValue: parseTimestamp,
    parseLiteral(ast) {
      return parseTimestamp(ast.kind === Kind.STRING ? ast.value : null);
    },
  }),
};
