/**
 * @file WorkManifestation type definition and resolvers
 *
 */

import { getArray, getInfomediaDetails } from "../utils/utils";
import dayjs from "dayjs";

/**
 * The WorkManifestation type definition
 */
export const typeDef = `
    type HostPublication {
      title: String!
      details: String!
    }
    type WorkManifestation {
      content: [String!]
      cover: Cover! 
      creators: [Creator!]!
      datePublished(locale: String, format: String): CustomDateFormat!
      description: String!
      dk5: [DK5!]!
      edition: String!
      fullTitle: String!
      """
      Where this manifestation is published. For instance, in which magazine an article is published.
      """
      hostPublication: HostPublication
      isbn: String
      language: [String!]!
      materialType: String!
      notes: [String!]!
      onlineAccess: [OnlineAccess!]!
      originals: [String!]!
      originalTitle: String
      physicalDescription: String!
      pid: String!
      publisher: [String!]!
      shelf: String
      title: String
      recommendations(limit: Int): [Recommendation!]!
      availability: Availability
      checkorder(pickupBranch: String!): CheckOrderPolicy
      admin: AdminData
      inLanguage: String
      usedLanguage: [String],
      physicalDescriptionArticles: String
      volume: String
    }
  `;

/**
 * Resolvers for the WorkManifestation type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 *
 * Generally, we first look in the parent object for data, and
 * if not present we call moreinfo or openformat
 */
export const resolvers = {
  WorkManifestation: {
    async content(parent, args, context, info) {
      if (parent.content) {
        return parent.content;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );

      const content = getArray(manifestation, "details.content.value").map(
        (entry) => entry.$
      )[0];
      if (content) {
        return content.split(/\s*[;]\s*/);
      }
      return [];
    },
    cover(parent, args, context, info) {
      // Fetch cover, and pass it to Cover resolver
      return context.datasources.moreinfo.load(parent.id);
    },
    async description(parent, args, context, info) {
      if (parent.description) {
        return parent.description;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );

      return (
        getArray(manifestation, "details.abstract.value").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    async dk5(parent, args, context, info) {
      if (parent.dk5) {
        return parent.dk5;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.dk5").map((entry) => ({
        searchCode: (entry.searchCode && entry.searchCode.$) || "",
        searchString: (entry.searchString && entry.searchString.$) || "",
        value: (entry.value && entry.value.$) || "",
      }));
    },
    async creators(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.creators.value");
    },
    async datePublished(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );

      // For articles and maybe other stuff we have a date here
      let date = getArray(manifestation, "details.hostPublication.details").map(
        (entry) => entry.$
      )[0];
      if (date && dayjs(date).isValid()) {
        return { date, ...args };
      }

      // Date could be here as well
      date = getArray(manifestation, "details.articleData.article.volume").map(
        (entry) => entry.$
      )[0];
      if (date && dayjs(date).isValid()) {
        return { date, ...args };
      }

      // Or at least we have the year most of the times
      return (
        getArray(manifestation, "details.publication.publicationYear").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    async edition(parent, args, context, info) {
      if (parent.edition) {
        return parent.edition;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        getArray(manifestation, "details.edition.value").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    async fullTitle(parent, args, context, info) {
      if (parent.fullTitle) {
        return parent.fullTitle;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        getArray(manifestation, "details.title.value").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    async isbn(parent, args, context, info) {
      if (parent.isbn) {
        return parent.isbn;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );

      const res = getArray(manifestation, "details.isbn.value").map(
        (entry) => entry.$
      )[0];
      if (typeof res === "string") {
        return res.replace(/-/g, "");
      }
    },
    async language(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.language").map(
        (entry) => entry.$
      );
    },

    async materialType(parent, args, context, info) {
      if (parent.materialType) {
        return parent.materialType;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );

      return (
        getArray(manifestation, "details.materialType").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    async notes(parent, args, context, info) {
      if (parent.notes) {
        return parent.notes;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.notes.value").map(
        (entry) => entry.$
      );
    },
    async onlineAccess(parent, args, context, info) {
      const result = [];

      // Check if work is an article
      const isArticle = parent.workTypes.includes("article");

      if (isArticle) {
        // Get article (InfomediaContent) from infomedia
        try {
          const article = await context.datasources.infomedia.load({
            pid: parent.id,
            accessToken: context.accessToken,
          });

          if (article && article[0]) {
            // get details from infomedia article
            const details = getInfomediaDetails(article[0]);

            result.push({ ...article[0], details });
          }
        } catch (e) {
          // TODO: handle not logged in
        }
      }

      // Get onlineAccess from openformat (UrlReferences)
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );

      const data = getArray(manifestation, "details.onlineAccess.value");

      data.forEach((entry) => {
        if (entry.link) {
          result.push({
            url: (entry.link && entry.link.$) || "",
            note: (entry.note && entry.note.$) || "",
          });
        }
      });

      // Return array containing both InfomediaContent and UrlReferences
      return result;
    },
    async originals(parent, args, context, info) {
      if (parent.originals) {
        return parent.originals;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.originals.value").map(
        (entry) => entry.$
      );
    },
    async originalTitle(parent, args, context, info) {
      if (parent.originalTitle) {
        return parent.originalTitle;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        getArray(manifestation, "details.originalTitle.value").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    async physicalDescription(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        getArray(manifestation, "details.physicalDescription.value").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    pid(parent, args, context, info) {
      return parent.id;
    },
    async publisher(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.publication.publisher").map(
        (entry) => entry.$
      );
    },
    async hostPublication(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return getArray(manifestation, "details.hostPublication").map(
        (entry) => ({
          title: (entry.title && entry.title.$) || "",
          details: (entry.details && entry.details.$) || "",
        })
      )[0];
    },
    async recommendations(parent, args, context, info) {
      const recommendations = await context.datasources.recommendations.load({
        pid: parent.id,
        limit: args.limit,
      });
      return recommendations.response;
    },
    async shelf(parent, args, context, info) {
      if (parent.shelf) {
        return parent.shelf;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );

      return getArray(manifestation, "details.shelf.value").map(
        (entry) => entry.$
      )[0];
    },
    async title(parent, args, context, info) {
      if (parent.title) {
        return parent.title;
      }
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );

      return (
        getArray(manifestation, "details.title.value").map(
          (entry) => entry.$
        )[0] || ""
      );
    },
    async availability(parent, args, context, info) {
      return await context.datasources.availability.load({
        pid: parent.id,
        accessToken: context.accessToken,
      });
    },
    async checkorder(parent, args, context, info) {
      return await context.datasources.checkorder.load({
        pid: parent.id,
        pickupBranch: args.pickupBranch,
      });
    },

    async admin(parent, args, context, info) {
      return { pid: parent.id };
    },

    async usedLanguage(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        manifestation &&
        manifestation.details &&
        manifestation.details.usedLanguage &&
        getArray(manifestation, "details.usedLanguage").map((entry) => entry.$)
      );
    },

    async inLanguage(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        (manifestation &&
          manifestation.details &&
          manifestation.details.inLanguage &&
          manifestation.details.inLanguage.$) ||
        "da"
      );
    },
    async physicalDescriptionArticles(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        (manifestation &&
          manifestation.details &&
          manifestation.details.physicalDescriptionArticles &&
          manifestation.details.physicalDescriptionArticles.$) ||
        null
      );
    },
    async volume(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.id
      );
      return (
        (manifestation &&
          manifestation.details &&
          manifestation.details.volume &&
          manifestation.details.volume.$) ||
        null
      );
    },
  },
};
