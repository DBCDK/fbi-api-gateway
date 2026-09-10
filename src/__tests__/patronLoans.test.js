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

  test("currentLoans rejects a negative offset as bad user input", async () => {
    const context = createContext(jest.fn());

    await expect(
      resolvers.Patron.currentLoans(null, { offset: -1 }, context)
    ).rejects.toMatchObject({
      message: "offset must be greater than or equal to 0",
      extensions: { code: "BAD_USER_INPUT" },
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

  test("historicalLoans rejects a negative offset as bad user input", async () => {
    const context = createContext(jest.fn());

    await expect(
      resolvers.Patron.historicalLoans(null, { offset: -1 }, context)
    ).rejects.toMatchObject({
      message: "offset must be greater than or equal to 0",
      extensions: { code: "BAD_USER_INPUT" },
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("collection exposes UserData status, hitcount and items", () => {
    const items = [{ id: publicLoanId }];
    const parent = { hitcount: 27, status: "OK", items };

    expect(resolvers.PatronHistoricalLoans.hitcount(parent)).toBe(27);
    expect(resolvers.PatronHistoricalLoans.status(parent)).toBe("OK");
    expect(resolvers.PatronHistoricalLoans.items(parent)).toBe(items);
  });

  test("historical-loan account resolves the patron's current matching account", () => {
    const context = createContext(jest.fn());

    expect(
      resolvers.HistoricalLoan.account({ agencyId: "710100" }, {}, context)
    ).toEqual({
      agencyId: "710100",
      userId: "local-id",
      municipalityNumber: "101",
      municipalityAgencyId: "710100",
      blocked: false,
    });
    expect(
      resolvers.HistoricalLoan.account({ agencyId: "unknown" }, {}, context)
    ).toBeNull();
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

  test("add distinguishes invalid material IDs from missing manifestations", async () => {
    const serviceLoad = jest.fn();
    const context = createAddContext(serviceLoad);

    await expect(
      resolvers.PatronMutation.addHistoricalLoans(
        null,
        { loans: [{ materialId: "ostepops" }] },
        context
      )
    ).resolves.toEqual({
      status: "FAILED",
      items: [{ materialId: "ostepops", status: "INVALID_MATERIAL_ID" }],
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(serviceLoad).not.toHaveBeenCalled();
  });

  test("add rejects an inverted historical date range", async () => {
    const context = createAddContext(jest.fn());

    await expect(
      resolvers.PatronMutation.addHistoricalLoans(
        null,
        {
          loans: [
            {
              materialId: "pid:1",
              loanedAt: new Date("2026-05-20T00:00:00.000Z"),
              returnedAt: new Date("2026-05-01T00:00:00.000Z"),
            },
          ],
        },
        context
      )
    ).resolves.toEqual({
      status: "FAILED",
      items: [{ materialId: "pid:1", status: "INVALID_DATE_RANGE" }],
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("add accepts a missing loanedAt or returnedAt without a range check", async () => {
    const serviceLoad = jest.fn();
    const context = createAddContext(serviceLoad);

    await expect(
      resolvers.PatronMutation.addHistoricalLoans(
        null,
        {
          dryRun: true,
          loans: [
            { materialId: "pid:1", loanedAt: null, returnedAt: "2026-05-01" },
            { materialId: "pid:2", loanedAt: "2026-05-20", returnedAt: null },
          ],
        },
        context
      )
    ).resolves.toEqual({
      status: "OK",
      items: [
        { materialId: "pid:1", status: "OK" },
        { materialId: "pid:2", status: "OK" },
      ],
    });
    expect(serviceLoad).not.toHaveBeenCalled();
  });

  test("historical-loan mutations reject empty batches as bad user input", async () => {
    const context = createContext(jest.fn());

    await expect(
      resolvers.PatronMutation.addHistoricalLoans(null, { loans: [] }, context)
    ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
    await expect(
      resolvers.PatronMutation.deleteHistoricalLoans(null, { ids: [] }, context)
    ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
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
        { id: invalidId, status: "INVALID_ID" },
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
        { id: "invalid", status: "INVALID_ID" },
      ],
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("delete identifies a request containing only invalid IDs", async () => {
    const context = createContext(jest.fn());

    await expect(
      resolvers.PatronMutation.deleteHistoricalLoans(
        null,
        { ids: ["ostepops"] },
        context
      )
    ).resolves.toEqual({
      status: "FAILED",
      items: [{ id: "ostepops", status: "INVALID_ID" }],
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });
});

describe("Patron historical loan consent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-05T12:00:00+02:00"));
  });

  afterEach(() => jest.useRealTimers());

  test("gets consent and exposes age eligibility from birthDate and birthYear", async () => {
    const load = jest.fn().mockResolvedValue({ consent: true });
    const context = createContext(load, {
      user: {
        uniqueId: "loan-user",
        birthDate: "1506",
        birthYear: "1980",
      },
    });

    await expect(
      resolvers.Patron.historicalLoanConsent(null, {}, context)
    ).resolves.toEqual({
      isGranted: true,
      canBeChanged: true,
      status: "GRANTED",
    });
    expect(context.datasources.getLoader).toHaveBeenCalledWith(
      "userDataV2GetHistoricalLoanConsent"
    );
    expect(load).toHaveBeenCalledWith({ accessToken });
  });

  test("uses CPR as fallback when separate birth fields are unavailable", async () => {
    const context = createContext(
      jest.fn().mockResolvedValue({ consent: false }),
      { user: { uniqueId: "loan-user", cpr: "1506800000" } }
    );

    await expect(
      resolvers.Patron.historicalLoanConsent(null, {}, context)
    ).resolves.toEqual({
      isGranted: false,
      canBeChanged: true,
      status: "NOT_GRANTED",
    });
  });

  test("prefers valid birth fields over CPR", async () => {
    const context = createContext(
      jest.fn().mockResolvedValue({ consent: false }),
      {
        user: {
          uniqueId: "loan-user",
          birthDate: "0608",
          birthYear: "2011",
          cpr: "1506800000",
        },
      }
    );

    await expect(
      resolvers.Patron.historicalLoanConsent(null, {}, context)
    ).resolves.toEqual({
      isGranted: false,
      canBeChanged: false,
      status: "UNDER_AGE",
    });
  });

  test("allows consent from the fifteenth birthday", async () => {
    const context = createContext(
      jest.fn().mockResolvedValue({ consent: false }),
      {
        user: {
          uniqueId: "loan-user",
          birthDate: "0508",
          birthYear: "2011",
        },
      }
    );

    await expect(
      resolvers.Patron.historicalLoanConsent(null, {}, context)
    ).resolves.toMatchObject({
      canBeChanged: true,
      status: "NOT_GRANTED",
    });
  });

  test("reports an unverifiable age while still retrieving consent", async () => {
    const load = jest.fn().mockResolvedValue({ consent: true });
    const context = createContext(load, {
      user: { uniqueId: "loan-user", birthDate: "3102", birthYear: "1980" },
    });

    await expect(
      resolvers.Patron.historicalLoanConsent(null, {}, context)
    ).resolves.toEqual({
      isGranted: true,
      canBeChanged: false,
      status: "AGE_NOT_VERIFIABLE",
    });
    expect(load).toHaveBeenCalledWith({ accessToken });
  });

  test("sets consent for an age-verified patron", async () => {
    const load = jest.fn().mockResolvedValue({ consent: true });
    const context = createContext(load, {
      user: {
        uniqueId: "loan-user",
        birthDate: "1506",
        birthYear: "1980",
      },
    });

    await expect(
      resolvers.PatronMutation.setHistoricalLoanConsent(
        null,
        { consent: true, dryRun: false },
        context
      )
    ).resolves.toEqual({
      status: "OK",
      historicalLoanConsent: {
        isGranted: true,
        canBeChanged: true,
        status: "GRANTED",
      },
    });
    expect(context.datasources.getLoader).toHaveBeenCalledWith(
      "userDataV2SetHistoricalLoanConsent"
    );
    expect(load).toHaveBeenCalledWith({ accessToken, consent: true });
    expect(context._loader.clear).toHaveBeenCalledWith({
      accessToken,
      consent: true,
    });
  });

  test("simulates consent without updating UserData during dryRun", async () => {
    const load = jest.fn();
    const context = createContext(load, {
      user: {
        uniqueId: "loan-user",
        birthDate: "1506",
        birthYear: "1980",
      },
    });

    await expect(
      resolvers.PatronMutation.setHistoricalLoanConsent(
        null,
        { consent: false, dryRun: true },
        context
      )
    ).resolves.toEqual({
      status: "OK",
      historicalLoanConsent: {
        isGranted: false,
        canBeChanged: true,
        status: "NOT_GRANTED",
      },
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });

  test.each([
    ["UNDER_AGE", { birthDate: "0608", birthYear: "2011" }],
    ["AGE_NOT_VERIFIABLE", {}],
  ])("does not set consent when eligibility is %s", async (status, user) => {
    const load = jest.fn();
    const context = createContext(load, {
      user: { uniqueId: "loan-user", ...user },
    });

    await expect(
      resolvers.PatronMutation.setHistoricalLoanConsent(
        null,
        { consent: true },
        context
      )
    ).resolves.toEqual({
      status,
      historicalLoanConsent: null,
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });

  test("returns an operation status for unauthenticated mutations", async () => {
    const context = createContext(jest.fn(), { accessToken: null });

    await expect(
      resolvers.PatronMutation.setHistoricalLoanConsent(
        null,
        { consent: false },
        context
      )
    ).resolves.toEqual({
      status: "ERROR_UNAUTHENTICATED_TOKEN",
      historicalLoanConsent: null,
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("returns FAILED when a consent update fails", async () => {
    const context = createContext(
      jest.fn().mockRejectedValue(new Error("boom")),
      {
        user: {
          uniqueId: "loan-user",
          birthDate: "1506",
          birthYear: "1980",
        },
      }
    );

    await expect(
      resolvers.PatronMutation.setHistoricalLoanConsent(
        null,
        { consent: false },
        context
      )
    ).resolves.toEqual({
      status: "FAILED",
      historicalLoanConsent: null,
    });
  });

  test("reports unauthenticated consent requests", async () => {
    const context = createContext(jest.fn(), { accessToken: null });

    await expect(
      resolvers.Patron.historicalLoanConsent(null, {}, context)
    ).resolves.toEqual({
      isGranted: null,
      canBeChanged: false,
      status: "ERROR_UNAUTHENTICATED_TOKEN",
    });
    expect(context.datasources.getLoader).not.toHaveBeenCalled();
  });

  test("returns FAILED when UserData consent cannot be retrieved", async () => {
    const context = createContext(
      jest.fn().mockRejectedValue(new Error("boom")),
      {
        user: {
          uniqueId: "loan-user",
          birthDate: "1506",
          birthYear: "1980",
        },
      }
    );

    await expect(
      resolvers.Patron.historicalLoanConsent(null, {}, context)
    ).resolves.toEqual({
      isGranted: null,
      canBeChanged: true,
      status: "FAILED",
    });
    expect(log.error).toHaveBeenCalledWith(
      "Failed to get historical loan consent from UserData. Message: boom"
    );
  });
});
