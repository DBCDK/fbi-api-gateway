/**
 * @file Type definitions and resolvers for marc
 */

export const typeDef = `
type MarcRecord {
  """
  The marc record identifier
  """
  id: String!

  """
  The library agency
  """
  agencyId: String!

  """
  The bibliographic record identifier
  """
  bibliographicRecordId: String!

  """
  The MARC record collection content as marcXchange XML string

  """
  content: String!

  """
  The serialization format of the MARC record content. Defaults to 'marcXchange'
  """
  contentSerializationFormat: String!

  """
  Flag indicating whether or not the record is deleted
  """
  deleted: Boolean!
}

type Marc {
  """
  Gets the MARC record collection for the given record identifier, containing either standalone or head and/or section and volume records.
  """
  getMarcByRecordId(
  """
  The marc record identifier
  """
  recordId: String!): MarcRecord
}

extend type Query {
  """
  Field for presenting bibliographic records in MARC format
  """
  marc: Marc!
}

extend type Work {
    """
    Field for presenting bibliographic records in MARC format
    """
    marc: MarcRecord
}
extend type Manifestation {
    """
    Field for presenting bibliographic records in MARC format
    """
    marc: MarcRecord
}
`;

export const resolvers = {
  Query: {
    async marc(parent, args, context, info) {
      return {};
    },
  },
  Marc: {
    async getMarcByRecordId(parent, args, context, info) {
      const recordId = args.recordId;

      return await context.datasources
        .getLoader("getMarcByRecordId")
        .load({ recordId });
    },
  },
  Work: {
    async marc(parent, args, context, info) {
      const recordId = parent.marcId;

      return await context.datasources
        .getLoader("getMarcByRecordId")
        .load({ recordId });
    },
  },
  Manifestation: {
    async marc(parent, args, context, info) {
      const recordId = parent.marcId;

      return await context.datasources
        .getLoader("getMarcByRecordId")
        .load({ recordId });
    },
  },
};
