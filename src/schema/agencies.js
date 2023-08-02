export const typeDef = `
type LatitudeLongitude {
  """
  Geolocation latitude
  """
  latitude: Float!
  
  """
  Geolocation longitude
  """
  longitude: Float!
}

type AgencyList {
  """
  Total number of agencies with branches that match query
  """
  agencyCount: Int!

  """
  List of agencyIds with branches that match query
  """
  agencyIds: [String!]!
  
  """
  Total number of branches that match query (across all resulting agencies)
  """
  branchCount: Int!
  
  """
  List of branchIds of branches that match query (across all resulting agencies)
  """
  branchIds: [String!]!

  """
  Agencies with branches that match query
  """
  agencies: [Agency!]!
}

type Agency {
  """
  Id of the agency (queryable)
  """
  agencyId: String!
  
  """
  Name of the agency (queryable)
  """
  agencyName: String!
  
  """
  Agency phonenumber (likely the main branch's number or null)
  """
  agencyPhone: String
  
  """
  Agency email (likely the main branch's number or null)
  """
  agencyEmail: String
  
  """
  Number of branches that match query within agency
  """
  branchCount: Int!
  
  """
  List of branchIds of branches that match query within agency
  """
  branchIds: [String!]!
  
  """
  Highlights specific to the agency
  """
  highlights: [Highlight!]!
  
  """
  Branches that match query within agency
  """
  agencyBranches: [AgencyBranch!]!
}

type AgencyBranch {
  """
  Id of the branch's agency (queryable)
  """
  agencyId: String!
  
  """
  Name of the branch's agency (queryable)
  """
  agencyName: String!

  """
  Id of the branch (queryable)
  """
  branchId: String!

  """
  Name of the branch (queryable)
  """
  branchName: [String!]!

  """
  Shortname of the branch (queryable)
  """
  branchShortName: [String!]!

  """
  Branch's phonenumber
  """
  branchPhone: String

  """
  Branch's email
  """
  branchEmail: String

  """
  Branch's InterLibraryLoan email
  """
  branchIllEmail: String

  """
  The city the branch is located in (queryable)
  """
  city: String

  """
  The geolocation of the branch
  """
  geolocation: LatitudeLongitude
  
  """
  Highlights specific to the branch and its agency
  """
  highlights: [Highlight!]!  

  """
  Opening hours of the branch (can be a html-element)
  """
  openingHours: [String!]!

  """
  Address of the branch (queryable)
  """
  postalAddress: String

  """
  PostalCode of the branch (queryable)
  """
  postalCode: Int
}
`;

function highlightResolver(parent, includedFields = null) {
  if (!parent.highlights) {
    return [];
  }

  return Object.entries(parent.highlights)
    .map(([key, value]) => ({
      key,
      value,
    }))
    .filter((highlight) => highlight.value.includes("<mark>"))
    .filter((highlight) =>
      includedFields === null ? true : includedFields.includes(highlight.key)
    );
}

export const resolvers = {
  Agency: {
    highlights(parent, args, context, info) {
      return highlightResolver(parent, ["agencyName", "agencyId"]);
    },
  },
  AgencyBranch: {
    highlights(parent, args, context, info) {
      return highlightResolver(parent);
    },
  },
};
