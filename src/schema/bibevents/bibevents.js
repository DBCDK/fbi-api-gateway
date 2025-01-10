export const typeDef = `


type BibEventFacet {
  value: String
  count: Int
}

type BibEventImage {
  url: String
  darkMuted: String
  darkVibrant: String
  lightMuted: String
  lightVibrant: String
  muted: String
  vibrant: String
  blurHash: String
}

type BibeventDateTime {
  start: String
  end: String
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
  generatedAudience: [String!]
  generatedCategory: [String!]
  generatedSubCategories: [String!]
  occurs: [String!]
  dateTime: BibeventDateTime
  image: BibEventImage
}

type BibeventFacets {
  occurs: [BibEventFacet!]
  state: [BibEventFacet!]
  branches: [BibEventFacet!]
  tags: [BibEventFacet!]
  addressCity: [BibEventFacet!]
  branchId: [BibEventFacet!]
  generatedAudience: [BibEventFacet!]
  generatedCategory: [BibEventFacet!]
  generatedSubCategories: [BibEventFacet!]
}

type Bibevents {
  hitcount: Int!
  events: [BibEvent!]!
  facets: BibeventFacets!
}

input BibEventsQueryInput {
  offset: Int
  limit: Int
  occurs: [String!] 
  state: [String!]
  branches: [String!]
  tags: [String!]
  addressCity: [String!]
  branchId: [String!]
  generatedAudience: [String!]
  generatedCategory: [String!]
  generatedSubCategories: [String!]
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
        .load(args?.input || {});

      return res.body;
    },
  },
};
