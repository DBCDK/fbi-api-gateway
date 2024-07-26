/**
 * @file This file contains tests for the inspiration operation
 */
import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("Inspiration - get both 'nyeste' and 'populære' in 'fiction' and 'games'", async () => {
  const result = await performTestQuery({
    query: `query ($limit: Int!, $filters: [CategoryFilter!]) {
      inspiration {
        categories(filter: $filters) {
          title
          type
          subCategories {
            title
            result(limit: $limit) {
              work {
                workId
                titles {
                  main
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      filters: [
        {
          category: "FICTION",
          subCategories: ["nyeste", "populære"],
        },
        {
          category: "GAMES",
          subCategories: ["nyeste", "populære"],
        },
      ],
      limit: 5,
    },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("Inspiration - 'populære' should sort before 'nyeste' in 'fiction'", async () => {
  const result = await performTestQuery({
    query: `query ($limit: Int!, $filters: [CategoryFilter!]) {
      inspiration {
        categories(filter: $filters) {
          title
          type
          subCategories {
            title
            result(limit: $limit) {
              work {
                workId
                titles {
                  main
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      filters: [
        {
          category: "FICTION",
          subCategories: ["populære", "nyeste"],
        },
      ],
      limit: 5,
    },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("Inspiration - only get 'nyeste' in 'fiction'", async () => {
  const result = await performTestQuery({
    query: `query ($limit: Int!, $filters: [CategoryFilter!]) {
      inspiration {
        categories(filter: $filters) {
          title
          type
          subCategories {
            title
            result(limit: $limit) {
              work {
                workId
                titles {
                  main
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      filters: [
        {
          category: "FICTION",
          subCategories: ["nyeste"],
        },
      ],
      limit: 5,
    },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("Inspiration - Empty subCategories array returns all subCategories in 'fiction'", async () => {
  const result = await performTestQuery({
    query: `query ($limit: Int!, $filters: [CategoryFilter!]) {
      inspiration {
        categories(filter: $filters) {
          title
          type
          subCategories {
            title
            result(limit: $limit) {
              work {
                workId
                titles {
                  main
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      filters: [
        {
          category: "FICTION",
          subCategories: [],
        },
      ],
      limit: 5,
    },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("Inspiration - no subCategories prop returns all subCategories in 'games'", async () => {
  const result = await performTestQuery({
    query: `query ($limit: Int!, $filters: [CategoryFilter!]) {
      inspiration {
        categories(filter: $filters) {
          title
          type
          subCategories {
            title
            result(limit: $limit) {
              work {
                workId
                titles {
                  main
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      filters: [
        {
          category: "GAMES",
        },
      ],
      limit: 5,
    },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("Inspiration - no categories returned when filters prop is empty", async () => {
  const result = await performTestQuery({
    query: `query ($limit: Int!, $filters: [CategoryFilter!]) {
      inspiration {
        categories(filter: $filters) {
          title
          type
          subCategories {
            title
            result(limit: $limit) {
              work {
                workId
                titles {
                  main
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      filters: [],
      limit: 5,
    },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("Inspiration - no categories returned when filters prop is missing", async () => {
  const result = await performTestQuery({
    query: `query ($limit: Int!, $filters: [CategoryFilter!]) {
      inspiration {
        categories(filter: $filters) {
          title
          type
          subCategories {
            title
            result(limit: $limit) {
              work {
                workId
                titles {
                  main
                }
              }
            }
          }
        }
      }
    }`,
    variables: {
      limit: 5,
    },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});
