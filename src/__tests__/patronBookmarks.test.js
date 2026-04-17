import { log } from "dbc-node-logger";
import { resolvers } from "../schema/patron/bookmarks";
import { resolveMaterial } from "../utils/utils";

jest.mock("../utils/utils", () => ({
  resolveMaterial: jest.fn(),
}));

jest.mock("dbc-node-logger", () => ({
  log: {
    error: jest.fn(),
  },
}));

describe("Patron bookmarks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("bookmarks query filters out bookmarks without id and logs", async () => {
    const result = await resolvers.Patron.bookmarks(
      null,
      {},
      {
        user: { uniqueId: "user-1" },
        profile: { agency: "190101" },
        smaug: {
          gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
        },
        datasources: {
          getLoader: jest.fn(() => ({
            load: jest.fn().mockResolvedValue({
              result: [
                {
                  bookmarkId: 42,
                  materialId: "pid:1",
                  createdAt: "2024-01-01T00:00:00.000Z",
                },
                {
                  materialId: "pid:2",
                  createdAt: "2024-01-02T00:00:00.000Z",
                },
              ],
            }),
          })),
        },
      }
    );

    expect(log.error).toHaveBeenCalledWith(
      "Ignoring bookmark without id from userData service",
      {
        materialId: "pid:2",
        createdAt: "2024-01-02T00:00:00.000Z",
        agencyId: undefined,
      }
    );
    expect(result).toEqual({
      result: [
        {
          bookmarkId: 42,
          materialId: "pid:1",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      status: "OK",
    });
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

  test("BookmarkItem.snapshot exposes stored fallback metadata", () => {
    expect(
      resolvers.BookmarkItem.snapshot({
        materialId: "pid:123",
        workId: "work-of:123",
        title: "Stored title",
        creator: "Stored creator",
        materialType: "BOOK",
        workType: "work",
      })
    ).toEqual({
      materialId: "pid:123",
      workId: "work-of:123",
      title: "Stored title",
      creator: "Stored creator",
      materialType: "BOOK",
      workType: "work",
    });
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

  test("addBookmarks returns OK when all materials already exist", async () => {
    resolveMaterial.mockResolvedValueOnce({
      workId: "work-1",
      titles: { main: ["Stored title"] },
      creators: { persons: [{ display: "Stored creator" }] },
      materialTypes: [{ specific: { code: "BOOK" } }],
      workTypes: ["work"],
    });

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      {
        bookmarks: [{ materialId: "work-of:test:1" }],
      },
      {
        user: { uniqueId: "user-1" },
        profile: { agency: "190101" },
        smaug: {
          app: { clientId: "client-1" },
          gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
        },
        datasources: {
          getLoader: jest.fn(() => ({
            load: jest.fn().mockResolvedValue({
              bookmarksAlreadyExists: [
                { materialId: "work-of:test:1", bookmarkId: 77 },
              ],
            }),
          })),
        },
      }
    );

    expect(result).toEqual({
      status: "OK",
      items: [
        {
          id: "77",
          materialId: "work-of:test:1",
          status: "ALREADY_EXISTS",
        },
      ],
    });
  });

  test("deleteBookmarks reports partial failure from delete count", async () => {
    const load = jest.fn().mockResolvedValue({ IdsDeletedCount: 1 });
    const context = {
      user: { uniqueId: "user-1" },
      profile: { agency: "190101" },
      smaug: {
        gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
      },
      datasources: {
        getLoader: jest.fn(() => ({
          load,
        })),
      },
    };

    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      {
        ids: ["11", "12"],
      },
      context
    );

    expect(load).toHaveBeenCalledWith({
      uniqueId: "user-1",
      bookmarkIds: [11, 12],
      agencyId: "190101",
      key: "key-1",
      application: "BIBLIOTEKDK",
    });

    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        { id: "11", status: "UNKNOWN_ERROR" },
        { id: "12", status: "UNKNOWN_ERROR" },
      ],
    });
  });

  test("deleteBookmarks fails with missing client configuration", async () => {
    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      {
        ids: ["11", "12"],
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
        { id: "11", status: "FAILED" },
        { id: "12", status: "FAILED" },
      ],
    });
  });

  test("deleteBookmarks fails when all bookmark ids are invalid", async () => {
    const load = jest.fn();

    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      {
        ids: ["abc", "def"],
      },
      {
        user: { uniqueId: "user-1" },
        profile: { agency: "190101" },
        smaug: {
          gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
        },
        datasources: {
          getLoader: jest.fn(() => ({
            load,
          })),
        },
      }
    );

    expect(load).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "FAILED",
      items: [
        { id: "abc", status: "FAILED" },
        { id: "def", status: "FAILED" },
      ],
    });
  });

  test("deleteBookmarks ignores invalid ids in service call and reports partial failure", async () => {
    const load = jest.fn().mockResolvedValue({ IdsDeletedCount: 1 });

    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      {
        ids: ["11", "abc"],
      },
      {
        user: { uniqueId: "user-1" },
        profile: { agency: "190101" },
        smaug: {
          gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
        },
        datasources: {
          getLoader: jest.fn(() => ({
            load,
          })),
        },
      }
    );

    expect(load).toHaveBeenCalledWith({
      uniqueId: "user-1",
      bookmarkIds: [11],
      agencyId: "190101",
      key: "key-1",
      application: "BIBLIOTEKDK",
    });
    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        { id: "11", status: "OK" },
        { id: "abc", status: "FAILED" },
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

  test("bookmarks query returns unauthenticated status without uniqueId", async () => {
    const result = await resolvers.Patron.bookmarks(
      null,
      {},
      {
        user: {},
        profile: { agency: "190101" },
        smaug: {
          gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
        },
      }
    );

    expect(result).toEqual({
      result: [],
      status: "ERROR_UNAUTHENTICATED_TOKEN",
    });
  });

  test("BookmarksStatusItem.material returns null without materialId", async () => {
    const result = await resolvers.BookmarksStatusItem.material({}, {}, {});

    expect(result).toBeNull();
    expect(resolveMaterial).not.toHaveBeenCalled();
  });

  test("BookmarkItem.id returns a string", () => {
    expect(resolvers.BookmarkItem.id({ bookmarkId: 42 })).toBe("42");
  });
});
