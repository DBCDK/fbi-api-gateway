import { findAliasesAndArgs } from "../graphQLQueryTools";

describe("findAliasesAndArgs", () => {
  it("should handle a query with aliases and variables", () => {
    const query = `
      query Example($q: SearchQueryInput!, $facetsLimit: Int!, $valuesLimit: Int!) {
        search(q: $q) {
          hitcount
          works(offset: 0, limit: 10) {
            workId
          }
          awesomeFacets: intelligentFacets(limit: $facetsLimit) {
            name
            values(limit: $valuesLimit) {
              key
              term
              score
            }
          }
        }
      }
    `;
    const variables = {
      q: { all: "harry", creator: "rowling" },
      facetsLimit: 5,
      valuesLimit: 5,
    };

    const result = findAliasesAndArgs(query, variables);

    expect(result).toEqual({
      search: { realPath: "search", args: { q: variables.q } },
      "search.works": {
        realPath: "search.works",
        args: { offset: 0, limit: 10 },
      },
      "search.awesomeFacets": {
        realPath: "search.intelligentFacets",
        args: { limit: 5 },
      },
      "search.awesomeFacets.values": {
        realPath: "search.intelligentFacets.values",
        args: { limit: 5 },
      },
    });
  });

  it("should handle a query with fragments", () => {
    const query = `
      fragment FacetValuesFragment on FacetResult {
        values(limit: $valuesLimit) {
          key
          term
          score
        }
      }

      query Example($q: SearchQueryInput!, $facetsLimit: Int!, $valuesLimit: Int!) {
        search(q: $q) {
          hitcount
          works(offset: 0, limit: 10) {
            workId
          }
          awesomeFacets: intelligentFacets(limit: $facetsLimit) {
            name
            ...FacetValuesFragment
          }
        }
      }
    `;
    const variables = {
      q: { all: "harry", creator: "rowling" },
      facetsLimit: 5,
      valuesLimit: 5,
    };

    const result = findAliasesAndArgs(query, variables);

    expect(result).toEqual({
      search: { realPath: "search", args: { q: variables.q } },
      "search.works": {
        realPath: "search.works",
        args: { offset: 0, limit: 10 },
      },
      "search.awesomeFacets": {
        realPath: "search.intelligentFacets",
        args: { limit: 5 },
      },
      "search.awesomeFacets.values": {
        realPath: "search.intelligentFacets.values",
        args: { limit: 5 },
      },
    });
  });

  it("should handle a query without aliases or variables", () => {
    const query = `
      query Example {
        search {
          hitcount
          works {
            workId
          }
        }
      }
    `;
    const result = findAliasesAndArgs(query);

    expect(result).toEqual({});
  });

  it("should handle nested aliases", () => {
    const query = `
      query Example($author: String) {
        books: allBooks(author: $author) {
          title
          writer: author {
            fullName: name
          }
        }
      }
    `;
    const variables = {
      author: "J.K. Rowling",
    };

    const result = findAliasesAndArgs(query, variables);

    expect(result).toEqual({
      books: { realPath: "allBooks", args: { author: "J.K. Rowling" } },
      "books.writer": { realPath: "allBooks.author", args: null },
      "books.writer.fullName": { realPath: "allBooks.author.name", args: null },
    });
  });
});
