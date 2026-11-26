// Label data for printing, used by Saxo.

export const typeDef = `
"""
A value with separate label and spine variants
"""
type ManifestationLabelText {
  """Value for the label"""
  label: String

  """Value for the spine"""
  spine: String
}

"""
Title content with separate label and spine variants
"""
type ManifestationLabelTitle {
  """Title content for the label"""
  label: [String!]!

  """Title content for the spine"""
  spine: [String!]!
}

type ManifestationLabelPhysicalDescription {
  """Attachment information"""
  attachments: String

  """Material unit information, e.g. '1 dvd-video'"""
  materialUnits: String
}

"""
Data used for printing labels for a manifestation
"""
type ManifestationLabelData {
  """Title content formatted for the label and spine"""
  title: ManifestationLabelTitle

  """Edition information"""
  edition: [String!]!

  """Creator content for the label and spine"""
  creatorForShelf: ManifestationLabelText

  """Physical description included in the label data"""
  physicalDescription: ManifestationLabelPhysicalDescription

  """Classification content for the label and spine"""
  classificationForShelf: ManifestationLabelText
}

extend type Manifestation {
  """
  Label data for printing labels for this manifestation.
  Returns null if no label data exists for the manifestation.
  """
  labelData: ManifestationLabelData
}
`;

function toList(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export const resolvers = {
  Manifestation: {
    async labelData(parent, args, context, info) {
      if (!parent?.pid) {
        return null;
      }

      return context.datasources.getLoader("label").load({ pid: parent.pid });
    },
  },
  ManifestationLabelData: {
    edition(parent) {
      return toList(parent?.edition);
    },
  },
  ManifestationLabelTitle: {
    label(parent) {
      return toList(parent?.label);
    },
    spine(parent) {
      return toList(parent?.spine);
    },
  },
  ManifestationLabelPhysicalDescription: {
    attachments(parent) {
      return parent?.attachments || null;
    },
    materialUnits(parent) {
      return parent?.materialUnits || null;
    },
  },
};
