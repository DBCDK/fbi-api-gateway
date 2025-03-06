export const typeDef = `
type ComplexSearchIndex {
   """
   The name of a Complex Search index
   """
   index: String!

   """
   Can be used for searching
   """
   search: Boolean!

   """
   Can be used for faceting
   """
   facet: Boolean!

   """
   Can be used for sorting
   """
   sort: Boolean!

   """
   Aliases for this index
   """
   aliases: [String!]
}

extend type Query {
   """
   All indexes in complex search
   """
   complexSearchIndexes: [ComplexSearchIndex!]
}
`;

export const resolvers = {
  Query: {
    async complexSearchIndexes(parent, args, context) {
      return context.datasources.getLoader("complexIndexes").load("");
    },
  },
};
