export const typeDef = `
type Draft_Query {
  work(id: String, faust: String): Draft_Work
}
extend type Query {
  draft: Draft_Query!
}
`;

export const resolvers = {
  Query: {
    draft() {
      return {};
    },
  },
  Draft_Query: {
    work(parent, args, context) {
      return {};
    },
  },
};
