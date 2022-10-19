import { resolveWork } from "../utils/utils";

/**
 * @file CatInspire type definition and resolvers
 *
 */

export const typeDef = `
  type Category {
    title: String!
    works(limit: Int): [Work!]!
  }
  
  type Categories {
    childrenBooksNonfiction: [Category!]!
    childrenBooksFiction: [Category!]!
    fiction: [Category!]!
    nonfiction: [Category!]!
    eBooks: [Category!]!
    articles: [Category!]!
    movies: [Category!]!
    games: [Category!]!
    music: [Category!]!
    sheetMusic: [Category!]!
 }`;

export const resolvers = {
  Categories: {
    childrenBooksNonfiction(parent) {
      return parent.childrenbooks_nonfiction;
    },
    childrenBooksFiction(parent) {
      return parent.childrenbooks_fiction;
    },
    eBooks(parent) {
      return parent.ebooks;
    },
    sheetMusic(parent) {
      return parent.sheet_music;
    },
  },

  Category: {
    title(parent) {
      return parent.title;
    },
    async works(parent, args, context, info) {
      const limit = args.limit || 10;
      const expanded = await Promise.all(
        parent.works.map(async (workid) => resolveWork({ id: workid }, context))
      );
      return expanded.filter((work) => !!work).slice(0, limit);
    },
  },
};
