import { resolveManifestation, resolveWork } from "../utils/utils";

export const typeDef = `
type Relations {
    """
    The story of this article is continued in this or these other article(s)
    """
    continuedIn: [Manifestation!]!

    """
    This story of this article actually started in this or these other article(s)
    """
    continues: [Manifestation!]!

    """
    The contents of this articles is also discussed in these articles
    """
    discussedIn: [Manifestation!]!

    """
    The article discusses the content of these articles
    """
    discusses: [Manifestation!]!

    """
    This story is adapted in this or these movie(s)
    """
    hasAdaptation: [Manifestation!]!

    """
    The contents of this manifestation is analysed in these manifestations
    """
    hasAnalysis: [Manifestation!]!

    """
    The creator of this manifestation is portrayed in these manifestations
    """
    hasCreatorDescription: [Manifestation!]!

    """
    The publisher of this manifestation has made a description of the content
    """
    hasDescriptionFromPublisher: [Manifestation!]!

    """
    This movie is based on this manuscript
    """
    hasManuscript: [Manifestation!]!

    """
    This manifestation has a 'materialevurdering' that was originally made for another manifestation, but it is still relevant (e.g. book/ebook)
    """
    hasReusedReview: [Manifestation!]!

    """
    This manifestation has these reviews
    """
    hasReview: [Manifestation!]!

    """
    This movie or game has this sound track
    """
    hasSoundtrack: [Manifestation!]!

    """
    This movie is based on this or these books
    """
    isAdaptationOf: [Manifestation!]!
    
    """
    This manifestation is an analysis of these manifestations
    """
    isAnalysisOf: [Manifestation!]!

    """
    This is a description from the original publisher of these manifestations
    """
    isDescriptionFromPublisherOf: [Manifestation!]!

    """
    This movie is based on this manuscript
    """
    isManuscriptOf: [Manifestation!]!

    """
    This 'materialevurdering' can also be used to review these relevant manifestations, even though it was originally made for another publication
    """
    isReusedReviewOf: [Manifestation!]!

    """
    This manifestation is a review of these manifestations
    """
    isReviewOf: [Manifestation!]!

    """
    This sound track for a game is related to these games
    """
    isSoundtrackOfGame: [Manifestation!]!

    """
    This sound track for a movie is related to these movies
    """
    isSoundtrackOfMovie: [Manifestation!]!

    """
    This album has these tracks
    """
    hasTrack: [Manifestation!]!

    """
    This music track is part of these albums
    """
    isPartOfAlbum: [Manifestation!]!

    """
    This article or book part can be found in these manifestations
    """
    isPartOfManifestation: [Manifestation!]!
}
extend type Work {
    """
    Relations to other manifestations
    """
    relations: Relations!
}
extend type Manifestation {
    """
    Relations to other manifestations
    """
    relations: Relations!
}
`;

async function relationsResolver(parent, args, context, { fieldName }) {
  const pids = parent?.[fieldName];
  if (!pids) {
    return [];
  }
  const manifestations = await Promise.all(
    pids.map((pid) => resolveManifestation({ pid }, context))
  );

  return manifestations.filter((m) => !!m);
}
export const resolvers = {
  Relations: {
    continuedIn: relationsResolver,
    continues: relationsResolver,
    discussedIn: relationsResolver,
    discusses: relationsResolver,
    hasAdaptation: relationsResolver,
    hasAnalysis: relationsResolver,
    hasCreatorDescription: relationsResolver,
    hasDescriptionFromPublisher: relationsResolver,
    hasManuscript: relationsResolver,
    hasReusedReview: relationsResolver,
    hasReview: relationsResolver,
    hasSoundtrack: relationsResolver,
    isAdaptationOf: relationsResolver,
    isAnalysisOf: relationsResolver,
    isDescriptionFromPublisherOf: relationsResolver,
    isManuscriptOf: relationsResolver,
    isReusedReviewOf: relationsResolver,
    isReviewOf: relationsResolver,
    isSoundtrackOfGame: relationsResolver,
    isSoundtrackOfMovie: relationsResolver,
    hasTrack: relationsResolver,
    isPartOfAlbum: relationsResolver,
    isPartOfManifestation: relationsResolver,
  },
  Work: {
    async relations(parent, args, context, info) {
      const workWithRelations = await context.datasources
        .getLoader("jedRelations")
        .load({ id: parent.workId, profile: context.profile });

      return workWithRelations?.relations || {};
    },
  },
  Manifestation: {
    async relations(parent, args, context, info) {
      const manifestationWithRelations = await context.datasources
        .getLoader("jedRelations")
        .load({ id: parent.pid, profile: context.profile });
      return manifestationWithRelations?.relations || {};
    },
  },
};
