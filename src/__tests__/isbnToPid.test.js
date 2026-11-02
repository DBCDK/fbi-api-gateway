import { load } from "../datasources/isbnToPid.datasource";

describe("isbnToPid datasource", () => {
  test("returns the matching manifestation PID from Complex Search searchHits", async () => {
    const complexSearchLoad = jest.fn().mockResolvedValue({
      works: ["work-of:870970-basis:12345678"],
      searchHits: {
        "work-of:870970-basis:12345678": ["870970-basis:87654321"],
      },
    });
    const context = {
      getLoader: jest.fn(() => ({ load: complexSearchLoad })),
    };
    const profile = { agency: "190101", name: "bibdk21" };

    await expect(load({ isbn: "9788776552176", profile }, context)).resolves.toBe(
      "870970-basis:87654321"
    );
    expect(context.getLoader).toHaveBeenCalledWith("complexsearch");
    expect(complexSearchLoad).toHaveBeenCalledWith({
      cql: 'term.isbn="9788776552176"',
      profile,
      offset: 0,
      limit: 1,
    });
  });

  test("returns null when there is no matching manifestation", async () => {
    const context = {
      getLoader: jest.fn(() => ({
        load: jest.fn().mockResolvedValue({ works: [], searchHits: {} }),
      })),
    };

    await expect(
      load(
        {
          isbn: "9788776552176",
          profile: { agency: "190101", name: "bibdk21" },
        },
        context
      )
    ).resolves.toBeNull();
  });

  test("normalizes and searches for an ISBN-10", async () => {
    const complexSearchLoad = jest
      .fn()
      .mockResolvedValue({ works: [], searchHits: {} });
    const context = {
      getLoader: jest.fn(() => ({ load: complexSearchLoad })),
    };
    const profile = { agency: "190101", name: "bibdk21" };

    await load({ isbn: "0-8044-2957-X", profile }, context);

    expect(complexSearchLoad).toHaveBeenCalledWith({
      cql: 'term.isbn="080442957X"',
      profile,
      offset: 0,
      limit: 1,
    });
  });

  test("does not search for an invalid ISBN", async () => {
    const context = { getLoader: jest.fn() };

    await expect(
      load(
        {
          isbn: "not-an-isbn",
          profile: { agency: "190101", name: "bibdk21" },
        },
        context
      )
    ).resolves.toBeNull();
    expect(context.getLoader).not.toHaveBeenCalled();
  });
});
