/**
 * @file CatInspire type definition and resolvers
 *
 */

import { createTraceId } from "../utils/trace";

export const typeDef = `
  input CategoryFilterInput {
    category: CategoryFiltersEnum!
    subCategories: [String!]
  }

  enum CategoryFiltersEnum {
    CHILDRENBOOKSNONFICTION
    CHILDRENBOOKSFICTION
    FICTION
    NONFICTION
    EBOOKS
    ARTICLES
    MOVIES
    GAMES
    MUSIC
    SHEETMUSIC
  }

 type Inspiration {
   categories(filter: [CategoryFilterInput!]): [Categories]!
 }`;

const mapEnums = {
  CHILDRENBOOKSNONFICTION: "childrenBooksNonfiction",
  CHILDRENBOOKSFICTION: "childrenBooksFiction",
  FICTION: "fiction",
  NONFICTION: "nonfiction",
  EBOOKS: "eBooks",
  ARTICLES: "articles",
  MOVIES: "movies",
  GAMES: "games",
  MUSIC: "music",
  SHEETMUSIC: "sheetMusic",
};

const mapKeys = {
  childrenBooksNonfiction: "childrenbooks_nonfiction",
  childrenBooksFiction: "childrenbooks_fiction",
  eBooks: "ebooks",
  sheetMusic: "sheet_music",
};

export const resolvers = {
  Inspiration: {
    async categories(parent, args, context, info) {
      const res = await context.datasources
        .getLoader("catInspire")
        .load("all-categories");

      // return empty array if none categories is specified in filter
      if (!args?.filter) {
        return [];
      }

      const result = args?.filter?.map(({ category, subCategories }) => {
        const key = mapEnums[category];
        // Some data keys differs from enum types - e.g. We do not use _ in api
        const data = res[mapKeys[key] || key];

        // filter subCategory data if any given
        if (subCategories?.length) {
          return {
            category: key,
            type: category,
            subCategories: subCategories
              .map((sub) => data.find(({ title }) => title === sub))
              .filter((element) => element !== undefined)
              .map((category) => ({
                ...category,
                result: category.result.map((item) => ({
                  ...item,
                  traceId: createTraceId(),
                })),
              })),
          };
        }

        return {
          category: key,
          type: category,
          subCategories: data,
        };
      });
      await context?.dataHub?.createInspirationEvent({
        input: { ...parent, ...args, profile: context.profile },
        result: { data: result },
      });
      return result;
    },
  },
};
