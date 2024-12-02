/**
 * @file Type definitions and resolvers for marc
 */

export const typeDef = `
type MarcRecord {
  """
  The library agency
  """
  agency: Branch

  """
  The bibliographic record identifier
  """
  bibliographicRecordId: Int!

  """
  The MARC record collection content as marcXchange XML string

  """
  content: String

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
  getMarcByRecodId(
  """
  The record identifier on the form {agencyId}:{bibliographicRecordId}
  """
  recordId: String!): MarcRecord
}

extend type Query {
  """
  Field for presenting bibliographic records in MARC format
  """
  marc: Marc 
}
`;

export const resolvers = {
  Query: {
    async marc(parent, args, context, info) {
      return {};
    },
  },
  Marc: {
    async getMarcByRecodId(parent, args, context, info) {
      const recordId = args.recordId;

      return await context.datasources
        .getLoader("getMarcByRecordId")
        .load({ recordId });
    },
  },
  MarcRecord: {
    async agency(parent, args, context, info) {
      const agencyid = parent.agencyId;
      const res = await context.datasources.getLoader("library").load({
        agencyid,
      });

      return res?.result?.[0];
    },
  },
};
