/**
 * @file Type definitions and resolvers for label data (shelf and spine labels)
 */

export const typeDef = `
"""
A value presented in two variants: one for the label and one for the spine of the material
"""
type ManifestationLabelText {
  """Text for the label"""
  label: String

  """Text for the spine"""
  spine: String
}

"""
Title presented in two variants. Each variant is a list of lines.
"""
type ManifestationLabelTitle {
  """Title lines for the label"""
  label: [String!]!

  """Title lines for the spine"""
  spine: [String!]!
}

type ManifestationLabelPhysicalDescription {
  """Attachments, if any"""
  attachments: String

  """Material units, e.g. '1 dvd-video'"""
  materialUnits: String
}

"""
Data used for printing labels for a manifestation, e.g. shelf labels and spine labels
"""
type ManifestationLabelData {
  """Title of the manifestation"""
  title: ManifestationLabelTitle

  """Edition statements, e.g. '1. udgave'"""
  edition: [String!]!

  """Creator used for shelving"""
  creatorForShelf: ManifestationLabelText

  """Physical description of the manifestation"""
  physicalDescription: ManifestationLabelPhysicalDescription

  """Classification used for shelving"""
  classificationForShelf: ManifestationLabelText
}

extend type Manifestation {
  """
  Label data for this manifestation, e.g. for printing shelf labels and spine labels.
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
