import { resolvers } from "../schema/patron/account";
import { resolvers as patronResolvers } from "../schema/patron";

describe("Patron accounts", () => {
  test("resolves patron fields from the current token user", async () => {
    const load = jest.fn().mockResolvedValue({
      name: "Test User",
      mail: "test@example.com",
      address: "Test Street 1",
      postalCode: "1000",
      country: "DK",
    });
    const context = {
      user: {
        userId: "current-user",
        loggedInAgencyId: "710100",
        loggedInBranchId: "710101",
        municipality: "101",
        municipalityAgencyId: "710100",
        blocked: true,
      },
      datasources: {
        getLoader: jest.fn(() => ({ load })),
      },
    };

    await expect(patronResolvers.Patron.name(null, {}, context)).resolves.toBe(
      "Test User"
    );
    await expect(patronResolvers.Patron.email(null, {}, context)).resolves.toBe(
      "test@example.com"
    );
    await expect(
      patronResolvers.Patron.address(null, {}, context)
    ).resolves.toBe("Test Street 1");
    await expect(
      patronResolvers.Patron.postalCode(null, {}, context)
    ).resolves.toBe("1000");
    await expect(
      patronResolvers.Patron.country(null, {}, context)
    ).resolves.toBe("DK");

    expect(load).toHaveBeenCalledWith({
      agencyId: "710100",
      userId: "current-user",
    });
    expect(patronResolvers.Patron.municipalityNumber(null, {}, context)).toBe(
      "101"
    );
    expect(patronResolvers.Patron.municipalityAgencyId(null, {}, context)).toBe(
      "710100"
    );
    expect(patronResolvers.Patron.loggedInAgencyId(null, {}, context)).toBe(
      "710100"
    );
    expect(patronResolvers.Patron.loggedInBranchId(null, {}, context)).toBe(
      "710101"
    );
    expect(patronResolvers.Patron.blocked(null, {}, context)).toBe(true);
  });

  test("returns a lightweight reference for every CPR agency", () => {
    const result = resolvers.Patron.accounts(
      null,
      {},
      {
        user: {
          agencies: [
            { agencyId: "710100", userId: "111111", userIdType: "CPR" },
            { agencyId: "710100", userId: "333333", userIdType: "CPR" },
            { agencyId: "710100", userId: "local-id", userIdType: "LOCAL" },
            { agencyId: "715100", userId: "222222", userIdType: "CPR" },
            { agencyId: "718100", userId: "local-only", userIdType: "LOCAL" },
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
      {
        agencyId: "718100",
        blocked: false,
        municipalityAgencyId: "710100",
        municipalityNumber: "101",
        userId: "local-only",
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
