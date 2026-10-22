import { parse } from "graphql";
import { resolvers, typeDef } from "../schema/patron/bookmarks";
import { resolveManifestation, resolveWork } from "../utils/utils";

jest.mock("../utils/utils", () => ({
  resolveManifestation: jest.fn(),
  resolveWork: jest.fn(),
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

  test.each([
    // Application, source agency, current agency, agency-based, same app, same source
    ["STUDIESOEG", "872600", "872600", true, true, true],
    ["STUDIESOEG", "872600", "872960", true, true, false],
    ["DDBCMS", "872600", "872600", true, false, false],
    ["STUDIESOEG", null, "872600", true, true, null],
    ["STUDIESOEG", "872600", null, true, true, null],
    ["STUDIESOEG", "872600", "872960", false, true, true],
    ["BIBLIOTEKDK", "872600", "872600", false, false, false],
  ])(
    "source comparison: application=%s agency=%s currentAgency=%s agencyBased=%s",
    async (
      application,
      agencyId,
      currentAgency,
      agencyBased,
      sameApp,
      sameSource
    ) => {
      const context = createContext();
      context.profile = { agency: currentAgency };
      context.smaug.gateway.bookmarks.app = "STUDIESOEG";
      const configuration = {
        gateway: {
          bookmarks: { app: application, display: "Applikationens navn" },
          ...(agencyBased && { agencies: { ids: ["872600", "872960"] } }),
        },
      };
      context.smaug.gateway.agencies = configuration.gateway.agencies;
      const clientLoad = jest.fn().mockResolvedValue({ config: configuration });
      context.datasources.getLoader = jest.fn((name) => ({
        load:
          name === "authAdminClient"
            ? clientLoad
            : jest.fn().mockResolvedValue({
                hitcount: 2,
                result: [
                  {
                    agencyId,
                    branchId: "other-branch",
                    agencyName: "Other branch",
                  },
                  {
                    agencyId,
                    branchId: agencyId,
                    agencyName: "Roskilde Gymnasium",
                  },
                ],
              }),
      }));

      await expect(
        resolvers.BookmarkItem.source(
          { clientId: "source-client", application, agencyId },
          {},
          context
        )
      ).resolves.toEqual({
        displayName: agencyBased
          ? agencyId
            ? "Roskilde Gymnasium"
            : null
          : "Applikationens navn",
        isCurrentApplication: sameApp,
        isCurrentSource: sameSource,
      });
      expect(clientLoad).toHaveBeenCalledWith("source-client");
    }
  );

  test("unavailable source metadata preserves known comparisons", async () => {
    const context = createContext(
      jest.fn().mockRejectedValue(new Error("Unavailable"))
    );
    const bookmark = {
      clientId: "source-client",
      application: "BIBLIOTEKDK",
      agencyId: "872600",
    };
    await expect(
      resolvers.BookmarkItem.source(bookmark, {}, context)
    ).resolves.toEqual({
      displayName: null,
      isCurrentApplication: true,
      isCurrentSource: null,
    });

    context.datasources.getLoader = jest.fn((name) => ({
      load:
        name === "authAdminClient"
          ? jest
              .fn()
              .mockResolvedValue({
                config: {
                  gateway: {
                    bookmarks: { app: "BIBLIOTEKDK" },
                    agencies: { ids: ["872600"] },
                  },
                },
              })
          : jest.fn().mockRejectedValue(new Error("Library unavailable")),
    }));
    context.smaug.gateway.agencies = { ids: ["872600"] };
    context.profile = { agency: "872600" };
    await expect(
      resolvers.BookmarkItem.source(bookmark, {}, context)
    ).resolves.toEqual({
      displayName: null,
      isCurrentApplication: true,
      isCurrentSource: true,
    });
  });

  test("bookmark schema exposes agency instead of agencyId", () => {
    const document = parse(typeDef);
    for (const name of ["BookmarkItem", "BookmarksStatusItem"]) {
      const type = document.definitions.find(
        (definition) => definition.name?.value === name
      );
      expect(type.fields.map((field) => field.name.value)).not.toContain(
        "agencyId"
      );
      expect(
        type.fields.find((field) => field.name.value === "agency").type.name
          .value
      ).toBe("PatronAgency");
    }
  });

  test.each(["710100", null, undefined])(
    "addBookmarks forwards profile agency %s when available",
    async (agency) => {
      resolveWork.mockResolvedValueOnce({ workId: "work-of:test:1" });
      const load = jest.fn().mockResolvedValue({ results: [] });
      const context = createContext(load);
      context.profile = { agency };
      context.smaug.agencyId = "different-smaug-agency";

      await resolvers.PatronMutation.addBookmarks(
        null,
        { bookmarks: [{ materialId: "work-of:test:1" }] },
        context
      );

      const sent = load.mock.calls[0][0].bookmarks[0];
      if (agency == null) {
        expect(sent).not.toHaveProperty("agencyId");
      } else {
        expect(sent.agencyId).toBe(agency);
      }
    }
  );

  test.each([
    ["ok", "710100", "710100"],
    ["already_exists", "720100", "720100"],
    ["already_exists", null, null],
    ["already_exists", undefined, null],
    ["unknown_error", "720100", null],
  ])(
    "add result %s exposes stored agency %s",
    async (status, agencyId, expected) => {
      resolveWork.mockResolvedValueOnce({ workId: "work-of:test:1" });
      const context = createContext(
        jest.fn().mockResolvedValue({
          results: [{ id: bookmarkId, status, agencyId }],
        })
      );
      context.profile = { agency: "710100" };
      const result = await resolvers.PatronMutation.addBookmarks(
        null,
        { bookmarks: [{ materialId: "work-of:test:1" }] },
        context
      );
      expect(result.items[0].agencyId ?? null).toBe(expected);
      const agency = { hitcount: 1, result: [{ agencyId: expected }] };
      const load = jest.fn().mockResolvedValue(agency);
      await expect(
        resolvers.BookmarksStatusItem.agency(
          result.items[0],
          {},
          createContext(load)
        )
      ).resolves.toBe(expected ? agency : null);
      if (expected) {
        expect(load).toHaveBeenCalledWith({ agencyid: expected, limit: 50 });
      } else {
        expect(load).not.toHaveBeenCalled();
      }
    }
  );

  test.each(["710100", null, undefined])(
    "get exposes stored agency %s",
    async (agencyId) => {
      const context = createContext(
        jest.fn().mockResolvedValue({
          hitcount: 1,
          items: [{ id: bookmarkId, agencyId }],
        })
      );
      context.profile = { agency: "different-request-agency" };
      const result = await resolvers.Patron.bookmarks(null, {}, context);
      expect(result.items[0].agencyId ?? null).toBe(agencyId ?? null);
    }
  );

  test.each(["dryRun", "error", "delete"])(
    "%s returns null agency",
    async (operation) => {
      if (operation !== "delete") {
        resolveWork.mockResolvedValueOnce({ workId: "work-of:test:1" });
      }
      const load =
        operation === "error"
          ? jest.fn().mockRejectedValue(new Error("Unavailable"))
          : jest.fn().mockResolvedValue({
              results: [{ status: "ok", agencyId: "710100" }],
            });
      const context = createContext(load);
      context.profile = { agency: "710100" };
      const result =
        operation === "delete"
          ? await resolvers.PatronMutation.deleteBookmarks(
              null,
              { ids: [bookmarkId] },
              context
            )
          : await resolvers.PatronMutation.addBookmarks(
              null,
              {
                bookmarks: [{ materialId: "work-of:test:1" }],
                dryRun: operation === "dryRun",
              },
              context
            );
      await expect(
        resolvers.BookmarksStatusItem.agency(result.items[0], {}, context)
      ).resolves.toBeNull();
      if (operation === "dryRun") expect(load).not.toHaveBeenCalled();
    }
  );

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
            materialTypes: [
              {
                materialTypeGeneral: { code: "BOOKS", display: "Bøger" },
                materialTypeSpecific: { code: "BOOK", display: "Bog" },
              },
            ],
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

  test("bookmarks forwards the work filter and exposes its paginated result", async () => {
    const workId = "work-of:pid:1";
    const items = [
      { id: "work", workId, materialId: workId },
      {
        id: "selection",
        workId,
        materialId: workId,
        selection: { materialTypes: { specific: ["BOOK"] } },
      },
      { id: "pid", workId, materialId: "pid:1" },
    ];
    const load = jest.fn().mockResolvedValue({ hitcount: 7, items });

    const result = await resolvers.Patron.bookmarks(
      null,
      {
        applications: ["BIBLIOTEKDK"],
        filter: { workId },
        orderBy: "TITLE_ASC",
        offset: 1,
        limit: 3,
      },
      createContext(load)
    );

    expect(load).toHaveBeenCalledWith({
      accessToken: "access-token",
      filterApplications: ["BIBLIOTEKDK"],
      filterWorkId: workId,
      orderBy: "TITLE_ASC",
      offset: 1,
      limit: 3,
    });
    expect(result).toEqual({ hitcount: 7, items, status: "OK" });
  });

  test("bookmarks rejects a filter containing an invalid work id", async () => {
    const context = createContext();

    await expect(
      resolvers.Patron.bookmarks(
        null,
        { filter: { workId: "pid:1" } },
        context
      )
    ).rejects.toMatchObject({
      message: "filter.workId must be a valid work ID",
      extensions: { code: "BAD_USER_INPUT" },
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
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
        materialTypes: [
          {
            materialTypeGeneral: { code: "BOOKS", display: "Bøger" },
            materialTypeSpecific: { code: "BOOK", display: "Bog" },
          },
        ],
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

  test("BookmarkItem.agency resolves the stored agency using the loans library lookup", async () => {
    const agency = {
      hitcount: 1,
      result: [
        { agencyId: "710100", branchId: "710100", agencyName: "Library" },
      ],
    };
    const load = jest.fn().mockResolvedValue(agency);
    const context = createContext(load);
    context.profile = { agency: "720100" };

    await expect(
      resolvers.BookmarkItem.agency({ agencyId: "710100" }, {}, context)
    ).resolves.toBe(agency);
    expect(context.datasources.getLoader).toHaveBeenCalledWith("library");
    expect(load).toHaveBeenCalledWith({ agencyid: "710100", limit: 50 });
  });

  test.each([null, undefined])(
    "BookmarkItem.agency skips lookup for missing ID %s",
    async (agencyId) => {
      const context = createContext();
      context.profile = { agency: "720100" };
      await expect(
        resolvers.BookmarkItem.agency({ agencyId }, {}, context)
      ).resolves.toBeNull();
      expect(context.datasources.getLoader).not.toHaveBeenCalled();
    }
  );

  test.each([{ hitcount: 0, result: [] }, null, undefined])(
    "BookmarkItem.agency returns null when the library lookup finds no agency",
    async (response) => {
      const context = createContext(jest.fn().mockResolvedValue(response));
      await expect(
        resolvers.BookmarkItem.agency({ agencyId: "710100" }, {}, context)
      ).resolves.toBeNull();
    }
  );

  test("BookmarkItem.material returns an empty material wrapper without a material id", async () => {
    await expect(resolvers.BookmarkItem.material({}, {}, {})).resolves.toEqual(
      {}
    );
    expect(resolveManifestation).not.toHaveBeenCalled();
    expect(resolveWork).not.toHaveBeenCalled();
  });

  test("addBookmarks dryRun reports unresolved materials without calling UserData", async () => {
    resolveWork.mockResolvedValueOnce({ workId: "work-of:test:1" });
    resolveManifestation.mockResolvedValueOnce(null);
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
        {
          materialId: "work-of:test:1",
          selection: null,
          status: "OK",
        },
        {
          materialId: "pid:2",
          selection: null,
          status: "NOT_FOUND",
        },
      ],
    });
  });

  test("addBookmarks does not store a manifestation without a work id", async () => {
    resolveManifestation.mockResolvedValueOnce({ pid: "pid:1" });
    const context = createContext();

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      { bookmarks: [{ materialId: "pid:1" }] },
      context
    );

    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "FAILED",
      items: [
        { materialId: "pid:1", selection: null, status: "NOT_FOUND" },
      ],
    });
  });

  test("addBookmarks sends snapshots and maps ordered V2 results", async () => {
    resolveManifestation
      .mockResolvedValueOnce({
        pid: "pid:1",
        workId: "work-1",
        titles: { main: ["Stored title"] },
        creators: { persons: [{ display: "Stored creator" }] },
        materialTypes: [
          {
            general: { code: "BOOKS", display: "Bøger" },
            specific: { code: "BOOK", display: "Bog" },
          },
        ],
        workTypes: ["LITERATURE"],
        hostPublication: {
          edition: "Årg. 10",
          pages: "S. 12-15",
          publisher: "Eksempelbladet",
        },
        languages: { main: [{ isoCode: "dan" }] },
      })
      .mockResolvedValueOnce(null);
    resolveWork.mockResolvedValueOnce({ workId: "work-of:pid:3" });
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
          { materialId: "work-of:pid:3" },
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
          workId: "work-1",
          materialId: "pid:1",
          snapshot: {
            pid: "pid:1",
            workId: "work-1",
            title: "Stored title",
            creator: "Stored creator",
            materialTypes: [
              {
                materialTypeGeneral: {
                  code: "BOOKS",
                  display: "Bøger",
                },
                materialTypeSpecific: {
                  code: "BOOK",
                  display: "Bog",
                },
              },
            ],
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
          workId: "work-of:pid:3",
          materialId: "work-of:pid:3",
          snapshot: {
            pid: null,
            workId: "work-of:pid:3",
            title: null,
            creator: null,
            workType: null,
            periodical: null,
          },
        },
      ],
    });
    const sentBookmarks = load.mock.calls[0][0].bookmarks;
    expect(sentBookmarks[0].snapshot).not.toHaveProperty("materialType");
    expect(sentBookmarks[0].snapshot).toHaveProperty("materialTypes");
    expect(sentBookmarks[1].snapshot).not.toHaveProperty("materialType");
    expect(sentBookmarks[1].snapshot).not.toHaveProperty("materialTypes");
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
          selection: null,
          status: "ALREADY_EXISTS",
        },
        {
          materialId: "pid:2",
          selection: null,
          status: "NOT_FOUND",
        },
        {
          id: missingBookmarkId,
          materialId: "work-of:pid:3",
          selection: null,
          status: "OK",
        },
      ],
    });
  });

  test("addBookmarks normalizes and stores a specific material type selection", async () => {
    const work = {
      workId: "work-of:pid:1",
      titles: { main: ["Stored title"] },
      materialTypes: [
        {
          general: { code: "AUDIO_BOOKS", display: "Lydbøger" },
          specific: { code: "AUDIO_BOOK", display: "Lydbog" },
        },
      ],
      manifestations: {
        all: [
          {
            pid: "pid:1",
            materialTypes: [
              {
                general: { code: "AUDIO_BOOKS", display: "Lydbøger" },
                specific: { code: "AUDIO_BOOK", display: "Lydbog" },
              },
            ],
          },
          {
            pid: "pid:2",
            materialTypes: [
              {
                general: { code: "BOOKS", display: "Bøger" },
                specific: { code: "BOOK", display: "Bog" },
              },
            ],
          },
        ],
      },
    };
    resolveWork.mockResolvedValueOnce(work);
    const load = jest.fn().mockResolvedValue({
      results: [{ id: bookmarkId, status: "ok" }],
    });

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      {
        bookmarks: [
          {
            materialId: "work-of:pid:1",
            selection: {
              materialTypes: {
                specific: ["AUDIO_BOOK", "AUDIO_BOOK"],
              },
            },
          },
        ],
      },
      createContext(load)
    );

    expect(load).toHaveBeenCalledWith({
      accessToken: "access-token",
      bookmarks: [
        {
          workId: "work-of:pid:1",
          materialId: "work-of:pid:1",
          selection: {
            materialTypes: {
              specific: ["AUDIO_BOOK"],
            },
          },
          snapshot: {
            pid: null,
            workId: "work-of:pid:1",
            title: "Stored title",
            creator: null,
            materialTypes: [
              {
                materialTypeGeneral: {
                  code: "AUDIO_BOOKS",
                  display: "Lydbøger",
                },
                materialTypeSpecific: {
                  code: "AUDIO_BOOK",
                  display: "Lydbog",
                },
              },
            ],
            workType: null,
            periodical: null,
          },
        },
      ],
    });
    expect(load.mock.calls[0][0].bookmarks[0].snapshot).not.toHaveProperty(
      "materialType"
    );
    expect(result).toEqual({
      status: "OK",
      items: [
        {
          id: bookmarkId,
          materialId: "work-of:pid:1",
          selection: {
            materialTypes: {
              specific: ["AUDIO_BOOK"],
            },
          },
          status: "OK",
        },
      ],
    });
  });

  test("BookmarkItem.material returns only manifestations matching the stored selection", async () => {
    const matchingManifestation = {
      pid: "pid:1",
      materialTypes: [
        {
          general: { code: "AUDIO_BOOKS", display: "Lydbøger" },
          specific: { code: "AUDIO_BOOK", display: "Lydbog" },
        },
      ],
    };
    const otherManifestation = {
      pid: "pid:2",
      materialTypes: [
        {
          general: { code: "BOOKS", display: "Bøger" },
          specific: { code: "BOOK", display: "Bog" },
        },
      ],
    };
    const work = {
      workId: "work-of:pid:1",
      manifestations: {
        all: [matchingManifestation, otherManifestation],
      },
    };
    resolveWork.mockResolvedValueOnce(work);

    const material = await resolvers.BookmarkItem.material(
      {
        materialId: "work-of:pid:1",
        selection: {
          materialTypes: {
            general: ["AUDIO_BOOKS"],
          },
        },
      },
      {},
      createContext()
    );

    expect(material).toEqual({
      work,
      manifestation: null,
      manifestations: [matchingManifestation],
    });
  });

  test("BookmarkItem.material applies AND semantics within a selection", async () => {
    const compoundManifestation = {
      pid: "pid:compound",
      materialTypes: [
        { specific: { code: "BOOK" } },
        { specific: { code: "CD" } },
      ],
    };
    const splitAcrossManifestations = [
      {
        pid: "pid:book",
        materialTypes: [{ specific: { code: "BOOK" } }],
      },
      {
        pid: "pid:cd",
        materialTypes: [{ specific: { code: "CD" } }],
      },
    ];
    const work = {
      workId: "work-of:pid:compound",
      manifestations: {
        all: [compoundManifestation, ...splitAcrossManifestations],
      },
    };
    resolveWork.mockResolvedValueOnce(work);

    await expect(
      resolvers.BookmarkItem.material(
        {
          materialId: work.workId,
          selection: {
            materialTypes: {
              specific: ["BOOK", "CD"],
            },
          },
        },
        {},
        createContext()
      )
    ).resolves.toEqual({
      work,
      manifestation: null,
      manifestations: [compoundManifestation],
    });
  });

  test("addBookmarks rejects a selection containing both general and specific codes", async () => {
    const context = createContext();

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      {
        dryRun: true,
        bookmarks: [
          {
            materialId: "work-of:pid:1",
            selection: {
              materialTypes: {
                general: ["BOOKS"],
                specific: ["BOOK"],
              },
            },
          },
        ],
      },
      context
    );

    expect(result).toEqual({
      status: "FAILED",
      items: [
        {
          materialId: "work-of:pid:1",
          selection: undefined,
          status: "INVALID_MATERIAL_ID",
        },
      ],
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("addBookmarks does not send an empty V2 batch when no material resolves", async () => {
    resolveManifestation.mockResolvedValueOnce(null);
    const context = createContext();

    const result = await resolvers.PatronMutation.addBookmarks(
      null,
      { bookmarks: [{ materialId: "pid:missing" }] },
      context
    );

    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "FAILED",
      items: [
        {
          materialId: "pid:missing",
          selection: null,
          status: "NOT_FOUND",
        },
      ],
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
      items: [
        {
          materialId: "ostepops",
          selection: undefined,
          status: "INVALID_MATERIAL_ID",
        },
      ],
    });
    expect(resolveManifestation).not.toHaveBeenCalled();
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
    resolveManifestation.mockResolvedValueOnce({ workId: "work-1" });
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
          selection: {
            materialTypes: {
              general: ["BOOKS"],
            },
          },
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
          selection: {
            materialTypes: {
              general: ["BOOKS"],
            },
          },
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

  test("BookmarksStatusItem.material returns an empty wrapper without materialId", async () => {
    const result = await resolvers.BookmarksStatusItem.material({}, {}, {});

    expect(result).toEqual({});
    expect(resolveManifestation).not.toHaveBeenCalled();
    expect(resolveWork).not.toHaveBeenCalled();
  });

  test("BookmarkItem.id preserves the public UUID", () => {
    expect(resolvers.BookmarkItem.id({ id: bookmarkId })).toBe(bookmarkId);
  });
});
