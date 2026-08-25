jest.mock("../utils/utils", () => ({
  resolveBorrowerCheck: jest.fn(),
  resolveBorrowerCheckSystem: jest.fn(),
  resolveLocalizations: jest.fn(),
}));

import { resolvers } from "../schema/libraries";
import { load } from "../datasources/vipcore_BorrowerCheckUsePincode.datasource";
import config from "../config";

describe("borrowerCheckUsePincode", () => {
  test.each([
    [
      "the agency for public libraries",
      { agencyId: "710100", branchId: "710101" },
      "710100",
    ],
    [
      "the branch for FFU libraries",
      { agencyId: "800010", branchId: "800044" },
      "800044",
    ],
  ])("uses %s", async (_description, branch, expectedLibraryId) => {
    const load = jest.fn().mockResolvedValue(true);
    const context = {
      datasources: {
        getLoader: jest.fn().mockReturnValue({ load }),
      },
    };

    await expect(
      resolvers.Branch.borrowerCheckUsePincode(branch, {}, context)
    ).resolves.toBe(true);
    expect(context.datasources.getLoader).toHaveBeenCalledWith(
      "vipcore_BorrowerCheckUsePincode"
    );
    expect(load).toHaveBeenCalledWith(expectedLibraryId);
  });

  test("loads the pincode setting from VIP Core", async () => {
    const fetch = jest.fn().mockResolvedValue({ body: true });

    await expect(load("820050", { fetch })).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      `${config.datasources.vipcore.url}/borchk/820050/`,
      { allowedErrorStatusCodes: [] }
    );
  });
});
