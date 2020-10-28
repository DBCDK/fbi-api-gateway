import { get } from "lodash";

const getArray = (obj, path) => {
  const res = get(obj, path);
  if (res) {
    if (Array.isArray(res)) {
      return res;
    }
    return [res];
  }
  return [];
};

export const typeDef = `
  type Manifestation {
    abstract: [String!]!
    adminData: AdminData!
    articleData: [String!]!
    articleIssn: [String!]!
    audience: [SearchQuery!]!
    catalogcode: [String!]!
    collection: [Manifestation!]!
    cover: Cover!
    content: [String!]!
    creators: [Creator!]!
    dk5: [SearchQuery!]!
    edition: [String!]!
    form: [SearchQuery!]!
    hostPublication: [String!]!
    isbn: [String!]!
    issn: [String!]!
    isText: [String!]!
    language: [String!]!
    latestReprint: [String!]!
    lettal: [String!]!
    level: [String!]!
    lix: [String!]!
    materialType: [String!]!
    notes: [String!]!
    onlineAccess: [String!]!
    originals: [String!]!
    originalsFaust: [SearchQuery!]!
    originalTitle: [String!]!
    otherClassification: [String!]!
    pagination: [String!]!
    periodicalPublication: [String!]!
    physicalDescription: [String!]!
    pid: String!
    publication: [String!]!
    recommendations(limit: Int): [Recommendation!]!
    related: [String!]!
    relatedSeries: [String!]!
    series: [String!]!
    shelf: [String!]!
    subject: [SearchQuery!]!
    subjectLaesekompas: [SearchQuery!]!
    systemaccess: [String!]!
    title: [String!]!
    titleFull: [String!]!
    tracks: [String!]!
    verifiedseries: [String!]!
    creatormatvurd: [String!]!
    fulltextmatvurd: [String!]!
  }
`;

const getStringArray = async (parent, args, context, info) => {
  const fieldName = info.fieldName;
  const manifestation = await context.datasources.openformat.load(parent.pid);
  return getArray(manifestation, `details.${fieldName}.value`).map(
    entry => entry.$
  );
};
const getObjectArray = async (parent, args, context, info) => {
  const fieldName = info.fieldName;
  const manifestation = await context.datasources.openformat.load(parent.pid);
  return getArray(manifestation, `details.${fieldName}`);
};
const pass = parent => {
  return parent;
};

export const resolvers = {
  Manifestation: {
    abstract: getStringArray,
    adminData: pass,
    articleData: getStringArray,
    articleIssn: getStringArray,
    audience: getObjectArray,
    catalogcode: getStringArray,
    async collection(parent, args, context, info) {
      const res = await context.datasources.idmapper.load(parent.pid);
      return res.map(pid => ({ pid }));
    },
    content: getStringArray,
    async cover(parent, args, context, info) {
      return await context.datasources.moreinfo.load(parent.pid);
    },
    async creators(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.pid
      );
      return getArray(manifestation, "details.creators.value");
    },
    dk5: getObjectArray,
    edition: getStringArray,
    form: getObjectArray,
    hostPublication: getStringArray,
    isbn: getStringArray,
    issn: getStringArray,
    isText: getStringArray,
    async language(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.pid
      );
      return getArray(manifestation, "details.language.$");
    },
    latestReprint: getStringArray,
    lettal: getStringArray,
    level: getStringArray,
    lix: getStringArray,
    async materialType(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.pid
      );
      return getArray(manifestation, "details.materialType.$");
    },
    notes: getStringArray,
    onlineAccess: getStringArray,
    originals: getStringArray,
    originalsFaust: getObjectArray,
    originalTitle: getStringArray,
    otherClassification: getStringArray,
    pagination: getStringArray,
    periodicalPublication: getStringArray,
    physicalDescription: getStringArray,
    publication: getStringArray,
    async recommendations(parent, args, context, info) {
      const recommendations = await context.datasources.recommendations.load({
        pid: parent.pid,
        limit: args.limit
      });
      return recommendations.response;
    },
    related: getStringArray,
    relatedSeries: getStringArray,
    series: getStringArray,
    shelf: getStringArray,
    subject: getObjectArray,
    subjectLaesekompas: getObjectArray,
    systemaccess: getStringArray,
    title: getStringArray,
    titleFull: getStringArray,
    tracks: getStringArray,
    verifiedseries: getStringArray,
    creatormatvurd: getStringArray,
    fulltextmatvurd: getStringArray
  }
};
