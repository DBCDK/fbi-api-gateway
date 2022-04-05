export const typeDef = `
union Draft_Review = Draft_ExternalReview | Draft_InfomediaReview | Draft_LibrariansReview

type Draft_ExternalReview {
  author: String
  date: String
  rating: String
  urls: [Draft_URL!]!
}

type Draft_InfomediaReview {
  author: String
  date: String
  origin: String
  rating: String
  id: String!
}

type Draft_LibrariansReview {
  author: String
  date: String
  sections: [TextWithWork!]!
  
  """ This is a pid """
  id: String!
}

extend type Draft_Work {
  reviews: [Draft_Review!]!
}
`;

export const resolvers = {
  Draft_Work: {
    reviews() {
      return [
        {
          __typename: "Draft_ExternalReview",
          author: "Test Testesen",
          date: "30-01-2014",
          rating: "4/5",
          urls: [
            {
              origin: "Literatursiden",
              url: "https://someurl.dk",
            },
            {
              origin: "Webarkiv",
              url: "https://someurl.dk",
            },
          ],
        },
        {
          __typename: "Draft_InfomediaReview",
          author: "Test Testesen",
          date: "30-01-2012",
          origin: "Politiken",
          rating: "5/5",
          id: "123456",
        },
        {
          __typename: "Draft_LibrariansReview",
          id: "870970:basis-123456",
          author: "Test Testesen",
          date: "30-01-2012",
          sections: [
            {
              heading: "body",
              text: "Hello",
            },
          ],
        },
      ];
    },
  },
};
