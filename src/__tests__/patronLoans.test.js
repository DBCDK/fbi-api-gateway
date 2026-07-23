import { log } from "dbc-node-logger";
import { resolvers } from "../schema/patron/loans";

jest.mock("dbc-node-logger", () => ({
  log: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Patron loans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loans query maps successful legacy response into patron shape", async () => {
    const result = await resolvers.Patron.loans(
      null,
      {},
      {
        accessToken: "DUMMY_TOKEN",
        user: {
          agencies: [
            { agencyId: "710100", userId: "123456", userIdType: "CPR" },
          ],
        },
        datasources: {
          getLoader: jest.fn(() => ({
            load: jest.fn().mockResolvedValue({
              status: true,
              statusCode: "OK",
              result: [{ loanId: "1", title: "Alpha", titleId: "12345678" }],
            }),
          })),
        },
      }
    );

    expect(result).toEqual({
      result: [{ loanId: "1", title: "Alpha", titleId: "12345678" }],
      status: "OK",
    });
  });

  test("loans query returns unauthenticated status without user", async () => {
    const result = await resolvers.Patron.loans(
      null,
      {},
      {
        datasources: {
          getLoader: jest.fn(),
        },
      }
    );

    expect(result).toEqual({
      result: [],
      status: "ERROR_UNAUTHENTICATED_TOKEN",
    });
  });

  test("PatronLoans.items sorts by due date ascending and paginates", () => {
    const parent = {
      result: [
        { loanId: "3", dueDate: "2024-03-01T00:00:00.000Z", title: "Charlie" },
        { loanId: "1", dueDate: "2024-01-01T00:00:00.000Z", title: "Alpha" },
        { loanId: "2", dueDate: "2024-02-01T00:00:00.000Z", title: "Bravo" },
      ],
    };

    const result = resolvers.PatronLoans.items(parent, {
      orderBy: "DUEDATE_ASC",
      offset: 1,
      limit: 1,
    });

    expect(result).toEqual([
      { loanId: "2", dueDate: "2024-02-01T00:00:00.000Z", title: "Bravo" },
    ]);
  });

  test("PatronLoanItem.id maps legacy loanId to public id field", () => {
    expect(resolvers.PatronLoanItem.id({ loanId: "5478268693" })).toBe(
      "5478268693"
    );
  });

  test("PatronLoanItem.status returns OVERDUE for past due dates", () => {
    expect(
      resolvers.PatronLoanItem.status({
        dueDate: "2026-07-20T00:00:00+02:00",
      })
    ).toBe("OVERDUE");
  });

  test("PatronLoanItem.status returns ACTIVE for future due dates", () => {
    expect(
      resolvers.PatronLoanItem.status({
        dueDate: "2026-07-28T00:00:00+02:00",
      })
    ).toBe("ACTIVE");
  });

  test("PatronLoans.items sorts by title descending", () => {
    const parent = {
      result: [
        { loanId: "1", title: "Alpha" },
        { loanId: "2", title: "Charlie" },
        { loanId: "3", title: "Bravo" },
      ],
    };

    const result = resolvers.PatronLoans.items(parent, {
      orderBy: "TITLE_DESC",
      offset: 0,
      limit: 3,
    });

    expect(result.map((item) => item.title)).toEqual([
      "Charlie",
      "Bravo",
      "Alpha",
    ]);
  });

  test("PatronLoans.items filters by status", () => {
    const parent = {
      result: [
        { loanId: "1", dueDate: "2026-07-20T00:00:00+02:00", title: "Past" },
        {
          loanId: "2",
          dueDate: "2026-07-28T00:00:00+02:00",
          title: "Future",
        },
      ],
    };

    const overdueItems = resolvers.PatronLoans.items(parent, {
      status: "OVERDUE",
      offset: 0,
      limit: 10,
    });
    const activeItems = resolvers.PatronLoans.items(parent, {
      status: "ACTIVE",
      offset: 0,
      limit: 10,
    });

    expect(overdueItems.map((item) => item.loanId)).toEqual(["1"]);
    expect(activeItems.map((item) => item.loanId)).toEqual(["2"]);
  });

  test("PatronLoanItem.snapshot exposes legacy fallback metadata", () => {
    expect(
      resolvers.PatronLoanItem.snapshot({
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

  test("PatronLoanItem.agency resolves branch data from library loader", async () => {
    const result = await resolvers.PatronLoanItem.agency(
      { agencyId: "732900" },
      {},
      {
        datasources: {
          getLoader: jest.fn(() => ({
            load: jest.fn().mockResolvedValue({
              result: [{ branchId: "732900", name: "Test Branch" }],
            }),
          })),
        },
      }
    );

    expect(result).toEqual({ branchId: "732900", name: "Test Branch" });
  });

  test("PatronLoanItem.snapshot returns null when no fallback metadata exists", () => {
    expect(
      resolvers.PatronLoanItem.snapshot({
        loanId: "1",
        dueDate: "2026-07-28T00:00:00+02:00",
        agencyId: "732900",
      })
    ).toBeNull();
  });

  test("loans query logs and returns failed on datasource error", async () => {
    const result = await resolvers.Patron.loans(
      null,
      {},
      {
        user: {
          agencies: [
            { agencyId: "710100", userId: "123456", userIdType: "CPR" },
          ],
        },
        datasources: {
          getLoader: jest.fn(() => ({
            load: jest.fn().mockRejectedValue(new Error("boom")),
          })),
        },
      }
    );

    expect(log.error).toHaveBeenCalledWith(
      "Failed to get loans from legacy loan service. Message: boom"
    );
    expect(result).toEqual({
      result: [],
      status: "FAILED",
    });
  });
});
