export const typeDef = `
type Draft_Work {
  title: Draft_WorkTitles!
  abstract: String
}
type Draft_WorkTitles {
  main: String!
  full: String!
  parallel: [String!]!
  sort: String!
  original: String
}
`;

export const resolvers = {
  Draft_Work: {
    title(parent, args, context) {
      return {
        main: "Some Title",
        full: "Some Title: Full",
        parallel: ["Parallel Title 1", "Parallel Title 2"],
        sort: "Some Title Sort",
        original: "Some Title Standard",
      };
    },
    abstract() {
      return "The abstract";
    },
  },
};
