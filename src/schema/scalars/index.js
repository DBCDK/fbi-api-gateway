const { GraphQLScalarType } = require("graphql");

export const typeDef = `
scalar PaginationLimit
`;

function inRange(value, min, max) {
  const intValue = parseInt(value, 10);
  if (intValue >= min && intValue <= max) {
    return intValue;
  }
  throw new Error(`Must be Integer in range ${min} to ${max}`);
}
export const resolvers = {
  PaginationLimit: new GraphQLScalarType({
    name: "PaginationLimit",
    description: "An integer in the range from 1 to 100",
    serialize(value) {
      // gets invoked when serializing the result to send it back to a client.
      return value;
    },
    parseValue(value) {
      // gets invoked to parse client input that was passed through variables.
      return inRange(value, 1, 100);
    },
    parseLiteral(ast) {
      // gets invoked to parse client input that was passed inline in the query.
      return inRange(ast.value, 1, 100);
    }
  })
};
