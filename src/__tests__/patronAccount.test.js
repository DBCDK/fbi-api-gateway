import { resolvers } from "../schema/patron/account";

describe("Patron accounts", () => {
  test("returns a lightweight reference for every CPR agency", () => {
    const result = resolvers.Patron.accounts(
      null,
      {},
      {
        user: {
          agencies: [
            { agencyId: "710100", userId: "111111", userIdType: "CPR" },
            { agencyId: "710100", userId: "local-id", userIdType: "LOCAL" },
            { agencyId: "715100", userId: "222222", userIdType: "CPR" },
          ],
          blocked: false,
          municipality: "101",
          municipalityAgencyId: "710100",
        },
      }
    );

    expect(result).toEqual([
      {
        agencyId: "710100",
        blocked: false,
        municipalityAgencyId: "710100",
        municipalityNumber: "101",
        userId: "111111",
      },
      {
        agencyId: "715100",
        blocked: false,
        municipalityAgencyId: "710100",
        municipalityNumber: "101",
        userId: "222222",
      },
    ]);
  });

  test("loads user data lazily for account fields", async () => {
    const load = jest.fn().mockResolvedValue({
      name: "Test User",
      mail: "test@example.com",
      address: "Test Street 1",
      postalCode: "1000",
      country: "DK",
    });
    const context = {
      datasources: {
        getLoader: jest.fn(() => ({ load })),
      },
    };
    const parent = { agencyId: "710100", userId: "111111" };

    await expect(
      resolvers.PatronAccount.name(parent, {}, context)
    ).resolves.toBe("Test User");
    await expect(
      resolvers.PatronAccount.email(parent, {}, context)
    ).resolves.toBe("test@example.com");

    expect(context.datasources.getLoader).toHaveBeenCalledWith("user");
    expect(load).toHaveBeenCalledWith({
      agencyId: "710100",
      userId: "111111",
    });
  });

  test("does not load user data when account identifiers are missing", async () => {
    const getLoader = jest.fn();

    await expect(
      resolvers.PatronAccount.name(
        {},
        {},
        {
          datasources: { getLoader },
        }
      )
    ).resolves.toBeUndefined();

    expect(getLoader).not.toHaveBeenCalled();
  });

  test("does not call a datasource when resolving the account list", () => {
    const getLoader = jest.fn();

    expect(
      resolvers.Patron.accounts(
        null,
        {},
        {
          user: {
            agencies: [
              { agencyId: "710100", userId: "111111", userIdType: "CPR" },
            ],
          },
          datasources: { getLoader },
        }
      )
    ).toHaveLength(1);

    expect(getLoader).not.toHaveBeenCalled();
  });

  test("returns an empty list for unauthenticated users", () => {
    expect(
      resolvers.Patron.accounts(
        null,
        {},
        {
          datasources: {},
        }
      )
    ).toEqual([]);
  });

  test("returns false when blocked is absent", () => {
    expect(resolvers.PatronAccount.blocked({})).toBe(false);
  });
});
