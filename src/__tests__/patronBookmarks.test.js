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

const bookmarkId = "45fb4d52-d7f7-4c36-a94f-37a00eb60163";
const missingBookmarkId = "d719653c-f40f-467f-acb5-a16f594a14a7";

function createContext(load = jest.fn()) {
  const loader = { load, clear: jest.fn() };
  return {
    accessToken: "access-token",
    user: { uniqueId: "user-1" },
    smaug: {
      app: { clientId: "client-1" },
      gateway: { bookmarks: { key: "key-1", app: "BIBLIOTEKDK" } },
    },
    datasources: {
      getLoader: jest.fn(() => loader),
    },
  };
}

describe("Patron bookmarks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("bookmarks forwards filters and pagination to UserData V2", async () => {
    const load = jest.fn().mockResolvedValue({
      hitcount: 2,
      items: [
        {
          id: bookmarkId,
          materialId: "pid:1",
          application: "BIBLIOTEKDK",
          snapshot: {
            version: 1,
            workId: "work-of:pid:1",
            title: "Title",
            creator: null,
            materialType: "BOOK",
            workType: "LITERATURE",
          },
          createdAt: "2026-07-29T10:00:00.000Z",
        },
      ],
    });
    const context = createContext(load);

    const result = await resolvers.Patron.bookmarks(
      null,
      {
        applications: ["BIBLIOTEKDK", "STUDIESOEG"],
        orderBy: "TITLE_ASC",
        offset: 10,
        limit: 5,
      },
      context
    );

    expect(context.datasources.getLoader).toHaveBeenCalledWith(
      "userDataV2GetBookmarks"
    );
    expect(load).toHaveBeenCalledWith({
      accessToken: "access-token",
      filterApplications: ["BIBLIOTEKDK", "STUDIESOEG"],
      orderBy: "TITLE_ASC",
      offset: 10,
      limit: 5,
    });
    expect(result).toEqual({
      hitcount: 2,
      items: expect.arrayContaining([
        expect.objectContaining({ id: bookmarkId }),
      ]),
      status: "OK",
    });
  });

  test("bookmarks rejects a negative offset as bad user input", async () => {
    const context = createContext();

    await expect(
      resolvers.Patron.bookmarks(null, { offset: -1 }, context)
    ).rejects.toMatchObject({
      message: "offset must be greater than or equal to 0",
      extensions: { code: "BAD_USER_INPUT" },
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("bookmarks applies V2 pagination defaults", async () => {
    const load = jest.fn().mockResolvedValue({ hitcount: 0, items: [] });

    await resolvers.Patron.bookmarks(null, {}, createContext(load));

    expect(load).toHaveBeenCalledWith({
      accessToken: "access-token",
      filterApplications: undefined,
      orderBy: "CREATEDAT_DESC",
      offset: 0,
      limit: 10,
    });
  });

  test("bookmarks returns unauthenticated status without access token", async () => {
    const context = createContext();
    context.accessToken = undefined;

    const result = await resolvers.Patron.bookmarks(null, {}, context);

    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(result).toEqual({
      hitcount: 0,
      items: [],
      status: "ERROR_UNAUTHENTICATED_TOKEN",
    });
  });

  test("bookmarks returns missing client configuration status", async () => {
    const context = createContext();
    context.smaug = {};

    const result = await resolvers.Patron.bookmarks(null, {}, context);

    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(result).toEqual({
      hitcount: 0,
      items: [],
      status: "ERROR_MISSING_CLIENT_CONFIGURATION",
    });
  });

  test("Bookmarks exposes the service page without local sorting", () => {
    const items = [
      { id: bookmarkId, title: "Zulu" },
      { id: missingBookmarkId, title: "Alpha" },
    ];

    expect(resolvers.Bookmarks.hitcount({ hitcount: 27 })).toBe(27);
    expect(resolvers.Bookmarks.items({ items })).toBe(items);
  });

  test("BookmarkItem exposes dynamic application and versioned snapshot", () => {
    const parent = {
      materialId: "pid:123",
      application: "NEW_APPLICATION",
      snapshot: {
        version: 1,
        workId: "work-of:pid:123",
        title: "Stored title",
        creator: null,
        materialType: "BOOK",
        workType: "LITERATURE",
      },
    };

    expect(resolvers.BookmarkItem.application(parent)).toBe("NEW_APPLICATION");
    expect(resolvers.BookmarkItem.snapshot(parent)).toEqual({
      ...parent.snapshot,
      _sourceMaterialId: "pid:123",
    });
  });

  test("BookmarkItem.materialId exposes stored material id on item level", () => {
    expect(resolvers.BookmarkItem.materialId({ materialId: "pid:123" })).toBe(
      "pid:123"
    );
  });

  test("BookmarkItem.material returns null without a material id", async () => {
    await expect(
      resolvers.BookmarkItem.material({}, {}, {})
    ).resolves.toBeNull();
    expect(resolveMaterial).not.toHaveBeenCalled();
  });

  test("addBookmarks dryRun reports unresolved materials without calling UserData", async () => {
    resolveMaterial.mockResolvedValueOnce({ workId: "work-1" });
    resolveMaterial.mockResolvedValueOnce(null);
    const context = createContext();

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      {
        dryRun: true,
        bookmarks: [{ materialId: "work-of:test:1" }, { materialId: "pid:2" }],
      },
      context
    );

    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        { materialId: "work-of:test:1", status: "OK" },
        { materialId: "pid:2", status: "NOT_FOUND" },
      ],
    });
  });

  test("addBookmarks sends snapshots and maps ordered V2 results", async () => {
    resolveMaterial
      .mockResolvedValueOnce({
        pid: "pid:1",
        workId: "work-1",
        titles: { main: ["Stored title"] },
        creators: { persons: [{ display: "Stored creator" }] },
        materialTypes: [{ specific: { code: "BOOK" } }],
        workTypes: ["LITERATURE"],
        hostPublication: {
          edition: "Årg. 10",
          pages: "S. 12-15",
          publisher: "Eksempelbladet",
        },
        languages: { main: [{ isoCode: "dan" }] },
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ workId: "work-3" });
    const load = jest.fn().mockResolvedValue({
      results: [
        {
          id: bookmarkId,
          materialId: "pid:1",
          status: "already_exists",
        },
        {
          id: missingBookmarkId,
          materialId: "pid:3",
          status: "ok",
        },
      ],
    });
    const context = createContext(load);

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      {
        bookmarks: [
          { materialId: "pid:1" },
          { materialId: "pid:2" },
          { materialId: "pid:3" },
        ],
      },
      context
    );

    expect(context.datasources.getLoader).toHaveBeenCalledWith(
      "userDataV2AddBookmarks"
    );
    expect(load).toHaveBeenCalledWith({
      accessToken: "access-token",
      bookmarks: [
        {
          materialId: "pid:1",
          snapshot: {
            pid: "pid:1",
            workId: "work-1",
            title: "Stored title",
            creator: "Stored creator",
            materialType: "BOOK",
            workType: "LITERATURE",
            periodical: {
              edition: "Årg. 10",
              pages: "S. 12-15",
              publisher: "Eksempelbladet",
              language: "dan",
            },
          },
        },
        {
          materialId: "pid:3",
          snapshot: {
            pid: null,
            workId: "work-3",
            title: null,
            creator: null,
            materialType: null,
            workType: null,
            periodical: null,
          },
        },
      ],
    });
    expect(
      context.datasources.getLoader.mock.results[0].value.clear
    ).toHaveBeenCalledWith({
      accessToken: "access-token",
      bookmarks: expect.any(Array),
    });
    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        {
          id: bookmarkId,
          materialId: "pid:1",
          status: "ALREADY_EXISTS",
        },
        { materialId: "pid:2", status: "NOT_FOUND" },
        {
          id: missingBookmarkId,
          materialId: "pid:3",
          status: "OK",
        },
      ],
    });
  });

  test("addBookmarks does not send an empty V2 batch when no material resolves", async () => {
    resolveMaterial.mockResolvedValueOnce(null);
    const context = createContext();

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      { bookmarks: [{ materialId: "pid:missing" }] },
      context
    );

    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "FAILED",
      items: [{ materialId: "pid:missing", status: "NOT_FOUND" }],
    });
  });

  test("addBookmarks distinguishes invalid material IDs from missing materials", async () => {
    const context = createContext();

    await expect(
      resolvers.PatronMutation.addBookmarks(
        null,
        { bookmarks: [{ materialId: "ostepops" }] },
        context
      )
    ).resolves.toEqual({
      status: "FAILED",
      items: [{ materialId: "ostepops", status: "INVALID_MATERIAL_ID" }],
    });
    expect(resolveMaterial).not.toHaveBeenCalled();
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("bookmark mutations reject empty batches as bad user input", async () => {
    const context = createContext();

    await expect(
      resolvers.PatronMutation.addBookmarks(null, { bookmarks: [] }, context)
    ).rejects.toMatchObject({
      extensions: { code: "BAD_USER_INPUT" },
    });
    await expect(
      resolvers.PatronMutation.deleteBookmarks(null, { ids: [] }, context)
    ).rejects.toMatchObject({
      extensions: { code: "BAD_USER_INPUT" },
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("addBookmarks maps service authentication errors", async () => {
    resolveMaterial.mockResolvedValueOnce({ workId: "work-1" });
    const error = new Error("request failed");
    error.serviceErrorCode = "INVALID_ACCESS_TOKEN";
    const load = jest.fn().mockRejectedValue(error);

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      { bookmarks: [{ materialId: "pid:1" }] },
      createContext(load)
    );

    expect(result).toEqual({
      status: "ERROR_UNAUTHENTICATED_TOKEN",
      items: [{ materialId: "pid:1", status: "UNKNOWN_ERROR" }],
    });
  });

  test("deleteBookmarks forwards UUIDs and maps per-item results", async () => {
    const load = jest.fn().mockResolvedValue({
      results: [
        {
          id: bookmarkId,
          materialId: "pid:1",
          status: "ok",
        },
        {
          id: missingBookmarkId,
          materialId: null,
          status: "not_found",
        },
      ],
    });
    const context = createContext(load);

    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      { ids: [bookmarkId, missingBookmarkId] },
      context
    );

    expect(context.datasources.getLoader).toHaveBeenCalledWith(
      "userDataV2DeleteBookmarks"
    );
    expect(load).toHaveBeenCalledWith({
      accessToken: "access-token",
      bookmarkIds: [bookmarkId, missingBookmarkId],
    });
    expect(
      context.datasources.getLoader.mock.results[0].value.clear
    ).toHaveBeenCalledWith({
      accessToken: "access-token",
      bookmarkIds: [bookmarkId, missingBookmarkId],
    });
    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        {
          id: bookmarkId,
          materialId: "pid:1",
          status: "OK",
        },
        {
          id: missingBookmarkId,
          materialId: null,
          status: "NOT_FOUND",
        },
      ],
    });
  });

  test("deleteBookmarks dryRun validates public UUIDs", async () => {
    const context = createContext();

    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      { dryRun: true, ids: [bookmarkId, "123"] },
      context
    );

    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        { id: bookmarkId, status: "OK" },
        { id: "123", status: "INVALID_ID" },
      ],
    });
  });

  test("deleteBookmarks keeps invalid IDs out of a mixed V2 request", async () => {
    const load = jest.fn().mockResolvedValue({
      results: [
        {
          id: bookmarkId,
          materialId: "pid:1",
          status: "ok",
        },
      ],
    });
    const context = createContext(load);

    const result = await resolvers.PatronMutation.deleteBookmarks(
      null,
      { ids: [bookmarkId, "123"] },
      context
    );

    expect(load).toHaveBeenCalledWith({
      accessToken: "access-token",
      bookmarkIds: [bookmarkId],
    });
    expect(result).toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        {
          id: bookmarkId,
          materialId: "pid:1",
          status: "OK",
        },
        { id: "123", status: "INVALID_ID" },
      ],
    });
  });

  test("deleteBookmarks identifies a request containing only invalid IDs", async () => {
    const context = createContext();

    await expect(
      resolvers.PatronMutation.deleteBookmarks(
        null,
        { ids: ["not-a-bookmark-id"] },
        context
      )
    ).resolves.toEqual({
      status: "FAILED",
      items: [{ id: "not-a-bookmark-id", status: "INVALID_ID" }],
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test.each([
    ["MISSING_ACCESS_TOKEN", "ERROR_UNAUTHENTICATED_TOKEN"],
    ["INVALID_ACCESS_TOKEN", "ERROR_UNAUTHENTICATED_TOKEN"],
    ["MISSING_USER_ID", "ERROR_UNAUTHENTICATED_TOKEN"],
    ["MISSING_BOOKMARK_CONFIGURATION", "ERROR_MISSING_CLIENT_CONFIGURATION"],
    ["INVALID_REQUEST", "FAILED"],
    ["AUTH_SERVICE_UNAVAILABLE", "FAILED"],
    ["INTERNAL_ERROR", "FAILED"],
  ])("maps UserData error %s to %s", async (serviceErrorCode, status) => {
    const error = new Error("safe service error");
    error.serviceErrorCode = serviceErrorCode;
    const context = createContext(jest.fn().mockRejectedValue(error));

    const result = await resolvers.Patron.bookmarks(null, {}, context);

    expect(result).toEqual({ hitcount: 0, items: [], status });
  });

  test("BookmarksStatusItem.material returns null without materialId", async () => {
    const result = await resolvers.BookmarksStatusItem.material({}, {}, {});

    expect(result).toBeNull();
    expect(resolveMaterial).not.toHaveBeenCalled();
  });

  test("BookmarkItem.id preserves the public UUID", () => {
    expect(resolvers.BookmarkItem.id({ id: bookmarkId })).toBe(bookmarkId);
  });
});
