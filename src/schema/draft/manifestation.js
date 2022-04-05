export const typeDef = `
type Draft_Manifestation {
  title: Draft_WorkTitles!
  access: [Draft_Access!]!
}
type Draft_URL {
  origin: String!
  url: String!
}
type Draft_Ill {
  ill: Boolean!
}
type Draft_InfomediaService {
  id: String!
}
type Draft_DigitalArticleService {
  issn: String!
}
union Draft_Access = Draft_URL | Draft_Ill | Draft_InfomediaService | Draft_DigitalArticleService

extend type Draft_Work {
  manifestations: [Draft_Manifestation!]!
}
`;

export const resolvers = {
  Draft_Manifestation: {
    title(parent, args, context) {
      return {
        main: "Some Title",
        full: "Some Title: Full",
        parallel: ["Parallel Title 1", "Parallel Title 2"],
        sort: "Some Title Sort",
        original: "Some Title Standard",
      };
    },
    access() {
      return [
        {
          __typename: "Draft_URL",
          origin: "dbcwebarkiv",
          url: "https://moreinfo.dbc.dk",
        },
        {
          __typename: "Draft_Ill",
          ill: true,
        },
        {
          __typename: "Draft_InfomediaService",
          id: "123456",
        },
        {
          __typename: "Draft_DigitalArticleService",
          issn: "123456",
        },
      ];
    },
  },
  Draft_Work: {
    manifestations() {
      return [{}, {}];
    },
  },
};
