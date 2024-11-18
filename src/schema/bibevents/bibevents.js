export const typeDef = `


type BibEventFacet {
  value: String
  count: Int
}


type BibEvent {
  uuid: String
  title: String
  description: String
  url: String
  createdAt: String
  updatedAt: String
  ticketManagerRelevance: Boolean
  state: String
  branches: [String!]
  addressCity: String
  tags: [String!]
  body: String
  branchId: String
}

type BibeventFacets {
  state: [BibEventFacet!]
  branches: [BibEventFacet!]
  tags: [BibEventFacet!]
  addressCity: [BibEventFacet!]
  branchId: [BibEventFacet!]
}

type Bibevents {
  hitcount: Int!
  events: [BibEvent!]!
  facets: BibeventFacets!
}

input BibEventsQueryInput {
  offset: Int
  limit: Int
  state: [String!]
  branches: [String!]
  tags: [String!]
  addressCity: [String!]
  branchId: [String!]
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
