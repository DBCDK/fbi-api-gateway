/**
 * @file CatInspire type definition and resolvers
 *
 */

export const typeDef = `
  input CategoryFilter {
    category: CategoryFilters!
    subCategories: [String!]
  }

  enum CategoryFilters {
    childrenBooksNonfiction
    childrenBooksFiction
    fiction
    nonfiction
    eBooks
    articles
    movies
    games
    music
    sheetMusic

    FICTION
  }

 type Inspiration {
   categories(filter: [CategoryFilter!]): [Categories]!
 }`;

const mapKeys = {
  childrenBooksNonfiction: "childrenbooks_nonfiction",
  childrenBooksFiction: "childrenbooks_fiction",
  eBooks: "ebooks",
  sheetMusic: "sheet_music",
  FICTION: "fiction",
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

      return args?.filter?.map(({ category, subCategories }) => {
        // Some data keys differs from enum types - e.g. We do not use _ in api
        const data = res[mapKeys[category] || category];

        // filter subCategory data if any given
        if (subCategories?.length) {
          return {
            category,
            subCategories: subCategories
              .map((sub) => data.find(({ title }) => title === sub))
              .filter((element) => element !== undefined),
          };
        }

        return {
          category,
          subCategories: data,
        };
      });
    },
  },
};
