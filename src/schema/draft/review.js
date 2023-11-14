import { resolveManifestation } from "../../utils/utils";

export const typeDef = `
enum ReviewElementType {
  ABSTRACT
  ACQUISITION_RECOMMENDATIONS
  AUDIENCE
  CONCLUSION
  DESCRIPTION
  EVALUATION
  SIMILAR_MATERIALS
}

type ReviewElement {
  content: String

  """
  This is a paragraph containing markup where links to manifestations
  can be inserted. For instance '"Axel Steens nye job minder om [870970-basis:20307021] fra ...'.
  Relevant manifestations are located in the manifestations field. 
  """
  contentSubstitute: String

  heading: String

  """
  Manifestations that can be used to generate and insert links into 'contentSubsitute'.
  """
  manifestations: [Manifestation]


  type: ReviewElementType
}

type ManifestationReview {
  rating: String
  reviewByLibrarians: [ReviewElement]
}

extend type Manifestation {

  """
  Some review data, if this manifestation is a review
  """
  review: ManifestationReview
}
`;

export const resolvers = {
  ReviewElement: {
    async manifestations(parent, args, context, info) {
      const manifestations = Promise.all(
        parent?.pidList?.map((pid) => {
          return resolveManifestation({ pid }, context);
        })
      );

      return manifestations;
    },
    async contentSubstitute(parent, args, context, info) {
      // TODO this is temporary until JED provides this string

      let substitute = parent?.content;

      // get all manifestations that are refered to in 'content'
      const manifestations = await Promise.all(
        parent?.pidList?.map((pid) => {
          return resolveManifestation({ pid }, context);
        })
      );

      // Substitute title for pid
      manifestations.forEach((m) => {
        substitute = substitute?.replace(m?.titles?.main, `[${m?.pid}]`);
      });

      return substitute;
    },
  },
};
