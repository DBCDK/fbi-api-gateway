export const typeDef = `


type BibEventFacet {
  value: String
  count: Int
}


type BibEvent {
  title: String
  timestamp: String
  shortlink: String
  uuid: String
  date: String
  time: String
  prices: [String!]
  library: String
  tags: [String!]
  description: String
  details: [String!]
  imageUrl: String
  category: String
  audience: String
}

type BibeventFacets {
  audience: [BibEventFacet!]!
  tags: [BibEventFacet!]!
  category: [BibEventFacet!]!
  library: [BibEventFacet!]!
}

type Bibevents {
  hitcount: Int!
  events: [BibEvent!]!
  facets: BibeventFacets!
}

input BibEventsQueryInput {
  offset: Int
  limit: Int
  audience: [String!]
  library: [String!]
  tags: [String!]
  category: [String!]
}

extend type Query {
  bibevents(input: BibEventsQueryInput): Bibevents!
}
`;

export const resolvers = {
  Query: {
    async bibevents(parent, args, context, info) {
      const res = await context.datasources
        .getLoader("bibevents")
        .load(args?.input);

      return res.body;
    },
  },
};
