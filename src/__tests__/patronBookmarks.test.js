import { resolvers } from "../schema/patron/bookmarks";
import { resolveMaterial } from "../utils/utils";

jest.mock("../utils/utils", () => ({
  resolveMaterial: jest.fn(),
}));

describe("Patron bookmarks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Bookmarks.items sorts by createdAt descending and paginates", () => {
    const parent = {
      result: [
        { title: "B", createdAt: "2024-01-01T00:00:00.000Z" },
        { title: "C", createdAt: "2024-03-01T00:00:00.000Z" },
        { title: "A", createdAt: "2024-02-01T00:00:00.000Z" },
      ],
    };

    const result = resolvers.Bookmarks.items(parent, {
      orderBy: "CREATEDAT_DESC",
      offset: 1,
      limit: 1,
    });

    expect(result).toEqual([
      { title: "A", createdAt: "2024-02-01T00:00:00.000Z" },
    ]);
  });

  test("Bookmarks.items sorts by title ascending", () => {
    const parent = {
      result: [
        { title: "Zulu", createdAt: "2024-01-01T00:00:00.000Z" },
        { title: "Alpha", createdAt: "2024-02-01T00:00:00.000Z" },
        { title: "Bravo", createdAt: "2024-03-01T00:00:00.000Z" },
      ],
    };

    const result = resolvers.Bookmarks.items(parent, {
      orderBy: "TITLE_ASC",
      offset: 0,
      limit: 3,
    });

    expect(result.map((item) => item.title)).toEqual(["Alpha", "Bravo", "Zulu"]);
  });

  test("BookmarkItem.application uses explicit application when present", () => {
    expect(
      resolvers.BookmarkItem.application({ application: "BIBLIOTEKDK" })
    ).toBe("BIBLIOTEKDK");
  });

  test("BookmarkItem.application falls back to agency mappings", () => {
    expect(resolvers.BookmarkItem.application({ agencyId: "190101" })).toBe(
      "BIBLIOTEKDK"
    );
    expect(resolvers.BookmarkItem.application({ agencyId: "872960" })).toBe(
      "STUDIESOEG"
    );
    expect(resolvers.BookmarkItem.application({ agencyId: "000000" })).toBe(
      "UNKNOWN"
    );
  });

  test("addBookmarks dryRun reports partial failure when one material is missing", async () => {
    resolveMaterial.mockResolvedValueOnce({ workId: "work-1" });
    resolveMaterial.mockResolvedValueOnce(null);

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      {
        dryRun: true,
        bookmarks: [{ materialId: "work-of:test:1" }, { materialId: "pid:2" }],
      },
      {
        user: { uniqueId: "user-1" },
        profile: { agency: "190101" },
        smaug: {
          app: { clientId: "client-1" },
          gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
        },
      }
    );

    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        { materialId: "work-of:test:1", status: "OK" },
        { materialId: "pid:2", status: "NOT_FOUND" },
      ],
    });
  });

  test("addBookmarks fails with missing client configuration", async () => {
    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      {
        bookmarks: [{ materialId: "work-of:test:1" }],
      },
      {
        user: { uniqueId: "user-1" },
        profile: { agency: "190101" },
        smaug: {},
      }
    );

    expect(result).toEqual({
      status: "ERROR_MISSING_CLIENT_CONFIGURATION",
      items: [{ materialId: "work-of:test:1", status: "FAILED" }],
    });
  });

  test("deleteBookmarks reports partial failure from delete count", async () => {
    const context = {
      user: { uniqueId: "user-1" },
      profile: { agency: "190101" },
      smaug: {
        gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
      },
      datasources: {
        getLoader: jest.fn(() => ({
          load: jest.fn().mockResolvedValue({ IdsDeletedCount: 1 }),
        })),
      },
    };

    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      {
        ids: [11, 12],
      },
      context
    );

    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        { id: 11, status: "UNKNOWN_ERROR" },
        { id: 12, status: "UNKNOWN_ERROR" },
      ],
    });
  });

  test("deleteBookmarks fails with missing client configuration", async () => {
    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      {
        ids: [11, 12],
      },
      {
        user: { uniqueId: "user-1" },
        profile: { agency: "190101" },
        smaug: {},
      }
    );

    expect(result).toEqual({
      status: "ERROR_MISSING_CLIENT_CONFIGURATION",
      items: [
        { id: 11, status: "FAILED" },
        { id: 12, status: "FAILED" },
      ],
    });
  });

  test("bookmarks query returns missing client configuration status", async () => {
    const result = await resolvers.Patron.bookmarks(
      null,
      {},
      {
        user: { uniqueId: "user-1" },
        profile: { agency: "190101" },
        smaug: {},
      }
    );

    expect(result).toEqual({
      result: [],
      status: "ERROR_MISSING_CLIENT_CONFIGURATION",
    });
  });

  test("BookmarksStatusItem.material returns null without materialId", async () => {
    const result = await resolvers.BookmarksStatusItem.material({}, {}, {});

    expect(result).toBeNull();
    expect(resolveMaterial).not.toHaveBeenCalled();
  });
});
