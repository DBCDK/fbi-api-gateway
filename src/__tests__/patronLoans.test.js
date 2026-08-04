import { log } from "dbc-node-logger";
import { resolvers } from "../schema/patron/loans";

jest.mock("dbc-node-logger", () => ({
  log: { error: jest.fn(), debug: jest.fn() },
}));

const accessToken = "DUMMY_TOKEN";
const publicLoanId = "45fb4d52-d7f7-4c36-a94f-37a00eb60163";
const secondPublicLoanId = "56ac5e63-e8a8-4d47-b05f-48b11fc71274";

function createContext(load, overrides = {}) {
  const loader = { load, clear: jest.fn() };
  return {
    accessToken,
    user: {
      uniqueId: "loan-user",
      agencies: [
        { agencyId: "710100", userId: "cpr-id", userIdType: "CPR" },
        { agencyId: "710100", userId: "local-id", userIdType: "LOCAL" },
      ],
      municipality: "101",
      municipalityAgencyId: "710100",
      blocked: false,
    },
    datasources: { getLoader: jest.fn(() => loader) },
    ...overrides,
    _loader: loader,
  };
}

const resolvedManifestation = {
  pid: "870970-basis:23424916",
  workId: "work-of:870970-basis:23424916",
  titles: { main: ["Efter uvejret"] },
  creators: { persons: [{ display: "Kenneth Bøgh Andersen" }] },
  materialTypes: [{ specific: { code: "BOOK" } }],
  workTypes: ["LITERATURE"],
  hostPublication: {
    edition: "Årg. 10",
    pages: "S. 12-15",
    publisher: "Eksempelbladet",
  },
  languages: { main: [{ isoCode: "dan", display: "Dansk" }] },
};

function createAddContext(serviceLoad, manifestation = resolvedManifestation) {
  const serviceLoader = { load: serviceLoad, clear: jest.fn() };
  const faustLoader = {
    load: jest.fn().mockResolvedValue("870970-basis:23424916"),
  };
  const manifestationLoader = {
    load: jest.fn().mockResolvedValue(manifestation),
  };
  const context = createContext(jest.fn(), {
    datasources: {
      getLoader: jest.fn((name) => {
        if (name === "faustToPid") return faustLoader;
        if (name === "jedRecord") return manifestationLoader;
        return serviceLoader;
      }),
    },
  });
  context._loader = serviceLoader;
  context._faustLoader = faustLoader;
  return context;
}

describe("Patron current loans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-24T12:00:00+02:00"));
  });

  afterEach(() => jest.useRealTimers());

  test("loads current loans from OpenUserStatus", async () => {
    const load = jest.fn().mockResolvedValue({
      status: true,
      statusCode: "OK",
      result: [{ loanId: "1", title: "Alpha", titleId: "12345678" }],
    });
    const context = createContext(load);

    await expect(
      resolvers.Patron.currentLoans(
        null,
        { orderBy: "TITLE_DESC", offset: 0, limit: 10 },
        context
      )
    ).resolves.toEqual({
      hitcount: 1,
      items: [{ loanId: "1", title: "Alpha", titleId: "12345678" }],
      status: "OK",
    });
    expect(context.datasources.getLoader).toHaveBeenCalledWith("loans");
    expect(load).toHaveBeenCalledWith({
      userInfoAccounts: [
        { agencyId: "710100", userId: "local-id", userIdType: "LOCAL" },
      ],
      accessToken,
    });
  });

  test("returns unauthenticated status without a user", async () => {
    const context = createContext(jest.fn(), { user: null });

    await expect(
      resolvers.Patron.currentLoans(null, {}, context)
    ).resolves.toEqual({
      hitcount: 0,
      items: [],
      status: "ERROR_UNAUTHENTICATED_TOKEN",
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("logs and returns failed on OpenUserStatus errors", async () => {
    const context = createContext(
      jest.fn().mockRejectedValue(new Error("boom"))
    );

    await expect(
      resolvers.Patron.currentLoans(null, {}, context)
    ).resolves.toEqual({ hitcount: 0, items: [], status: "FAILED" });
    expect(log.error).toHaveBeenCalledWith(
      "Failed to get loans from OpenUserStatus. Message: boom"
    );
  });

  test("collection exposes overall status, hitcount and items", () => {
    const items = [{ loanId: "1" }, { loanId: "2" }];
    const parent = { hitcount: 2, items, status: "OK" };

    expect(resolvers.PatronCurrentLoans.hitcount(parent)).toBe(2);
    expect(resolvers.PatronCurrentLoans.status(parent)).toBe("OK");
    expect(resolvers.PatronCurrentLoans.items(parent)).toBe(items);
  });

  test("currentLoans filters, sorts and paginates before building collection", async () => {
    const context = createContext(
      jest.fn().mockResolvedValue({
        status: true,
        result: [
          { loanId: "3", dueDate: "2026-07-30", title: "Charlie" },
          { loanId: "1", dueDate: "2026-07-20", title: "Alpha" },
          { loanId: "2", dueDate: "2026-07-28", title: "Bravo" },
        ],
      })
    );

    await expect(
      resolvers.Patron.currentLoans(
        null,
        {
          status: "ACTIVE",
          orderBy: "TITLE_DESC",
          offset: 1,
          limit: 1,
        },
        context
      )
    ).resolves.toEqual({
      hitcount: 2,
      items: [{ loanId: "2", dueDate: "2026-07-28", title: "Bravo" }],
      status: "OK",
    });
  });

  test("current-loan fields preserve legacy mappings", () => {
    expect(resolvers.CurrentLoan.id({ loanId: "5478268693" })).toBe(
      "5478268693"
    );
    expect(resolvers.CurrentLoan.status({ dueDate: "2026-07-20" })).toBe(
      "OVERDUE"
    );
    expect(resolvers.CurrentLoan.status({ dueDate: "2026-07-28" })).toBe(
      "ACTIVE"
    );
    expect(
      resolvers.CurrentLoan.snapshot({
        titleId: "142526328",
        title: "Brandmand",
        creator: "Lunter, Federico van",
        materialType: "Billedbog",
      })
    ).toEqual({
      _sourceFaust: "142526328",
      title: "Brandmand",
      creator: "Lunter, Federico van",
      materialType: "Billedbog",
      workType: null,
    });
  });

  test("current-loan account uses the preferred account", () => {
    const context = createContext(jest.fn());

    expect(
      resolvers.CurrentLoan.account({ agencyId: "710100" }, {}, context)
    ).toEqual({
      agencyId: "710100",
      userId: "local-id",
      municipalityNumber: "101",
      municipalityAgencyId: "710100",
      blocked: false,
    });
  });
});

describe("Patron historical loans", () => {
  beforeEach(() => jest.clearAllMocks());

  test("loads the collection from UserData", async () => {
    const items = [{ id: publicLoanId, loanedAt: "2026-05-01" }];
    const load = jest.fn().mockResolvedValue({ hitcount: 12, items });
    const context = createContext(load);

    await expect(
      resolvers.Patron.historicalLoans(null, { offset: 20, limit: 5 }, context)
    ).resolves.toEqual({ hitcount: 12, items, status: "OK" });
    expect(context.datasources.getLoader).toHaveBeenCalledWith(
      "userDataV2GetHistoricalLoans"
    );
    expect(load).toHaveBeenCalledWith({ accessToken, offset: 20, limit: 5 });
  });

  test("requires an authenticated user and access token", async () => {
    const load = jest.fn();
    const context = createContext(load, { accessToken: null });

    await expect(
      resolvers.Patron.historicalLoans(null, {}, context)
    ).resolves.toEqual({
      hitcount: 0,
      items: [],
      status: "ERROR_UNAUTHENTICATED_TOKEN",
    });
    expect(load).not.toHaveBeenCalled();
  });

  test("collection exposes UserData status, hitcount and items", () => {
    const items = [{ id: publicLoanId }];
    const parent = { hitcount: 27, status: "OK", items };

    expect(resolvers.PatronHistoricalLoans.hitcount(parent)).toBe(27);
    expect(resolvers.PatronHistoricalLoans.status(parent)).toBe("OK");
    expect(resolvers.PatronHistoricalLoans.items(parent)).toBe(items);
  });

  test.each([
    ["FAUST", { faust: "23424916" }],
    ["PID", { pid: "870970-basis:23424916" }],
  ])("resolves historical %s identifiers", async (type, expected) => {
    const load = jest.fn().mockResolvedValue(null);
    const context = createContext(load, { profile: "profile" });

    await resolvers.HistoricalLoan.manifestation(
      {
        materialId: type === "FAUST" ? "23424916" : "870970-basis:23424916",
        materialIdType: type,
      },
      {},
      context
    );
    expect(load).toHaveBeenCalledWith(
      type === "FAUST"
        ? { ...expected, profile: "profile" }
        : { id: expected.pid, profile: "profile" }
    );
  });

  test("add resolves material and sends dates plus a grouped snapshot", async () => {
    const load = jest.fn().mockResolvedValue({
      results: [{ id: publicLoanId, materialId: "23424916", status: "ok" }],
    });
    const context = createAddContext(load);
    const loans = [
      {
        agencyId: "710100",
        materialId: "23424916",
        loanedAt: new Date("2026-05-01T00:00:00.000Z"),
        returnedAt: new Date("2026-05-20T00:00:00.000Z"),
      },
    ];

    await expect(
      resolvers.PatronMutation.addHistoricalLoans(null, { loans }, context)
    ).resolves.toEqual({
      status: "OK",
      items: [{ id: publicLoanId, materialId: "23424916", status: "OK" }],
    });
    const serviceLoans = [
      {
        agencyId: "710100",
        materialId: "23424916",
        materialIdType: "FAUST",
        loanedAt: "2026-05-01",
        returnedAt: "2026-05-20",
        snapshot: {
          pid: "870970-basis:23424916",
          workId: "work-of:870970-basis:23424916",
          title: "Efter uvejret",
          creator: "Kenneth Bøgh Andersen",
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
    ];
    expect(context.datasources.getLoader).toHaveBeenCalledWith(
      "userDataV2AddHistoricalLoans"
    );
    expect(load).toHaveBeenCalledWith({ accessToken, loans: serviceLoans });
    expect(context._loader.clear).toHaveBeenCalledWith({
      accessToken,
      loans: serviceLoans,
    });
  });

  test("add does not send unresolved manifestations or client snapshots", async () => {
    const serviceLoad = jest.fn();
    const context = createAddContext(serviceLoad, null);

    await expect(
      resolvers.PatronMutation.addHistoricalLoans(
        null,
        {
          loans: [
            {
              materialId: "870970-basis:missing",
              snapshot: { title: "Must be ignored" },
            },
          ],
        },
        context
      )
    ).resolves.toEqual({
      status: "FAILED",
      items: [{ materialId: "870970-basis:missing", status: "NOT_FOUND" }],
    });
    expect(serviceLoad).not.toHaveBeenCalled();
  });

  test("delete forwards valid UUIDs and preserves input order", async () => {
    const invalidId = "not-a-uuid";
    const load = jest.fn().mockResolvedValue({
      results: [
        { id: publicLoanId, materialId: "pid:1", status: "ok" },
        { id: secondPublicLoanId, status: "not_found" },
      ],
    });
    const context = createContext(load);

    await expect(
      resolvers.PatronMutation.deleteHistoricalLoans(
        null,
        { ids: [publicLoanId, invalidId, secondPublicLoanId] },
        context
      )
    ).resolves.toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        { id: publicLoanId, materialId: "pid:1", status: "OK" },
        { id: invalidId, status: "FAILED" },
        { id: secondPublicLoanId, materialId: null, status: "NOT_FOUND" },
      ],
    });
    expect(load).toHaveBeenCalledWith({
      accessToken,
      ids: [publicLoanId, secondPublicLoanId],
    });
  });

  test("delete dry-run validates IDs without calling UserData", async () => {
    const context = createContext(jest.fn());

    await expect(
      resolvers.PatronMutation.deleteHistoricalLoans(
        null,
        { ids: [publicLoanId, "invalid"], dryRun: true },
        context
      )
    ).resolves.toEqual({
      status: "PARTIALLY_FAILED",
      items: [
        { id: publicLoanId, status: "OK" },
        { id: "invalid", status: "FAILED" },
      ],
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });
});
