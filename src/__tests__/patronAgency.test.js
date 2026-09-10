import { resolvers } from "../schema/patron/agency";

describe("Patron agency", () => {
  const branches = [
    {
      agencyId: "710100",
      agencyName: "Main agency",
      agencyType: "FOLKEBIBLIOTEK",
      branchId: "710101",
      name: "Local branch",
    },
    {
      agencyId: "710100",
      agencyName: "Main agency",
      agencyType: "FOLKEBIBLIOTEK",
      branchId: "710100",
      branchWebsiteUrl: "https://example.com",
      branchCatalogueUrl: "https://catalogue.example.com",
      branchPhone: "12345678",
      branchEmail: "library@example.com",
      pickupAllowed: true,
      name: "Main branch",
    },
  ];

  test("loads all branches for the account agency", async () => {
    const load = jest.fn().mockResolvedValue({
      hitcount: branches.length,
      result: branches,
    });

    const result = await resolvers.PatronAccount.agency(
      { agencyId: "710100" },
      {},
      {
        datasources: {
          getLoader: jest.fn(() => ({ load })),
        },
      }
    );

    expect(load).toHaveBeenCalledWith({
      agencyid: "710100",
      limit: 50,
    });
    expect(result).toEqual({
      hitcount: 2,
      result: branches,
    });
  });

  test("uses the branch whose branchId matches the agencyId", () => {
    const parent = {
      hitcount: branches.length,
      result: branches,
    };

    expect(resolvers.PatronAgency.id(parent)).toBe("710100");
    expect(resolvers.PatronAgency.name(parent)).toBe("Main agency");
    expect(resolvers.PatronAgency.type(parent)).toBe("FOLKEBIBLIOTEK");
    expect(resolvers.PatronAgency.websiteUrl(parent)).toBe(
      "https://example.com"
    );
    expect(resolvers.PatronAgency.phone(parent)).toBe("12345678");
    expect(resolvers.PatronAgency.email(parent)).toBe("library@example.com");
    expect(resolvers.PatronAgency.pickupAllowed(parent)).toBe(true);
    expect(resolvers.PatronAgency.temporarilyClosed(parent)).toBe(false);
    expect(resolvers.PatronAgency.numberOfBranches(parent)).toBe(2);
  });

  test("maps branches and preserves their agency parent", () => {
    const agency = {
      hitcount: branches.length,
      result: branches,
    };
    const result = resolvers.PatronAgency.branches(agency);

    expect(result).toHaveLength(2);
    expect(resolvers.PatronBranch.id(result[0])).toBe("710101");
    expect(result[0].name).toBe("Local branch");
    expect(resolvers.PatronBranch.agency(result[0])).toBe(agency);
  });

  test("falls back to the first branch when no main branch exists", () => {
    const parent = {
      hitcount: 1,
      result: [branches[0]],
    };

    expect(resolvers.PatronAgency.id(parent)).toBe("710100");
  });

  test("returns null when the account has no agencyId", async () => {
    expect(
      await resolvers.PatronAccount.agency({}, {}, { datasources: {} })
    ).toBeNull();
  });
});
