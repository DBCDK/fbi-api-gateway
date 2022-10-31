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
    childrenBooksNonfiction(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    childrenBooksFiction(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    fiction(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    nonfiction(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    eBooks(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    articles(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    movies(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    games(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    music(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!

    sheetMusic(
      """
      Filter on categories title e.g. "nyeste"
      """
      filters: [String!]
    ): [Category!]!
 }`;

function filterCategories(categories, filters) {
  return filters
    .map((f) => categories.find((c) => c.title === f))
    .filter((f) => f);
}

export const resolvers = {
  Categories: {
    childrenBooksNonfiction(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.childrenbooks_nonfiction, args.filters);
      }
      return parent.childrenbooks_nonfiction;
    },
    childrenBooksFiction(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.childrenbooks_fiction, args.filters);
      }
      return parent.childrenbooks_fiction;
    },
    fiction(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.fiction, args.filters);
      }
      return parent.fiction;
    },
    nonfiction(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.nonfiction, args.filters);
      }
      return parent.nonfiction;
    },
    eBooks(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.ebooks, args.filters);
      }
      return parent.ebooks;
    },
    articles(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.articles, args.filters);
      }
      return parent.articles;
    },
    movies(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.movies, args.filters);
      }
      return parent.movies;
    },
    games(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.games, args.filters);
      }
      return parent.games;
    },
    music(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.music, args.filters);
      }
      return parent.music;
    },
    sheetMusic(parent, args) {
      if (args.filters?.length > 0) {
        return filterCategories(parent.sheet_music, args.filters);
      }
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
        parent.works
          .slice(0, limit)
          .map(async (workid) => resolveWork({ id: workid }, context))
      );
      return expanded.filter((work) => !!work);
    },
  },
};
