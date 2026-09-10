jest.mock("isomorphic-unfetch", () => jest.fn());

jest.mock("../../../../src/config.js", () => ({
  datasources: {
    openorder: {
      authenticationUser: "user",
      authenticationGroup: "group",
      authenticationPassword: "password",
    },
    userInfo: { url: "https://example.test/userinfo" },
    vipcore: { url: "https://example.test/vipcore" },
    smaug: { url: "https://example.test/smaug" },
    openuserstatus: { url: "https://example.test/openuserstatus" },
  },
  fetchDefaultTimeoutMs: 5000,
  credentials: {
    disableInternalNetworkCheck: false,
  },
}));

jest.mock("../../../../commonUtils", () => ({
  parseClientPermissions: jest.fn(() => ({})),
}));

jest.mock("../../../../src/utils/municipalityAgencyId", () => ({
  setMunicipalityAgencyId: jest.fn(),
}));

jest.mock("../../../../src/utils/omitCulrData", () => ({
  omitUserinfoCulrData: jest.fn((value) => value),
}));

jest.mock("../../../../src/datasources/library.datasource", () => ({
  search: jest.fn(),
}));

jest.mock("../../../../src/datasources/culrGetAccountsByLocalId.datasource", () => ({
  load: jest.fn(),
}));

jest.mock("../../../../src/utils/agency", () => ({
  _isFFUAgency: jest.fn(() => false),
  _hasCulrDataSync: jest.fn(() => false),
  getAgencyIdByBranchId: jest.fn(),
}));

const fetch = require("isomorphic-unfetch");
const {
  setMunicipalityAgencyId,
} = require("../../../../src/utils/municipalityAgencyId");
const {
  load: getAccountsByLocalId,
} = require("../../../../src/datasources/culrGetAccountsByLocalId.datasource");
const {
  getAgencyIdByBranchId,
} = require("../../../../src/utils/agency");

const {
  buildConfigurationResponse,
  buildUserResponse,
} = require("../credentialProviders");

describe("credentialProviders optional enrichment guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("falls back when profile lookup fails during configuration build", async () => {
    fetch
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          app: {
            clientId: "client-1",
            grants: [],
          },
          user: {
            id: "user-1",
          },
          agencyId: "190101",
          gateway: {
            agencies: {
              ids: ["190101"],
              alwaysRequireAgencyId: false,
            },
          },
          expires: "2026-07-16T10:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ attributes: { userId: "1234" } }),
      })
      .mockRejectedValueOnce(new Error("vipcore timeout"));

    const result = await buildConfigurationResponse("token-1");

    expect(result).toEqual({
      status: 200,
      body: expect.objectContaining({
        clientId: "client-1",
        agency: "190101",
        defaultAgency: "190101",
        profiles: ["none"],
      }),
    });
  });

  test("returns authenticated user data even when optional enrichment steps fail", async () => {
    fetch
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          user: {
            agency: "790900",
          },
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          attributes: {
            idpUsed: "borchk",
            uniqueId: "guid-1",
            userId: "0102033690",
            municipalityAgencyId: "740000",
            agencies: [{ agencyId: "790900", userIdType: "CPR", userId: "0102033690" }],
          },
        }),
      })
      .mockRejectedValueOnce(new Error("openuserstatus timeout"));

    getAgencyIdByBranchId.mockRejectedValue(new Error("agency lookup timeout"));
    setMunicipalityAgencyId.mockRejectedValue(new Error("municipality timeout"));
    getAccountsByLocalId.mockRejectedValue(new Error("culr timeout"));

    const result = await buildUserResponse("token-2");

    expect(result).toEqual({
      status: 200,
      body: expect.objectContaining({
        loggedInAgencyId: "790900",
        loggedInBranchId: "790900",
        userId: "0102033690",
        isAuthenticated: true,
        municipalityAgencyId: "740000",
        agencies: ["790900"],
      }),
    });
    expect(getAgencyIdByBranchId).toHaveBeenCalled();
    expect(setMunicipalityAgencyId).toHaveBeenCalled();
  });
});
