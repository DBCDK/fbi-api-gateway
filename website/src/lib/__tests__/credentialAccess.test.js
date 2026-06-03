jest.mock("../credentialProviders", () => ({
  getAccessTokenForClient: jest.fn(),
  refreshAccessToken: jest.fn(),
  isInternalRequest: jest.fn(),
}));

jest.mock("../credentialSession", () => ({
  upsertCredentialSessionEntry: jest.fn(),
}));

const { resolveCredentialAccessToken } = require("../credentialAccess");
const {
  getAccessTokenForClient,
  isInternalRequest,
} = require("../credentialProviders");
const { upsertCredentialSessionEntry } = require("../credentialSession");

describe("resolveCredentialAccessToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isInternalRequest.mockReturnValue(true);
    upsertCredentialSessionEntry.mockImplementation(async (_ctx, id, entry) => ({
      id,
      ...entry,
    }));
  });

  test("renews an expired client-backed entry on internal network", async () => {
    getAccessTokenForClient.mockResolvedValue({
      status: 200,
      token: "renewed-token",
      refreshToken: null,
      tokenType: "Bearer",
      expiresAt: Date.now() + 60000,
      expiresIn: 60,
      grantTypeUsed: "password",
      clientSecretUsed: false,
    });

    const result = await resolveCredentialAccessToken({
      ctx: { req: { headers: {}, socket: {} }, res: {} },
      entryId: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      entry: {
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        type: "client",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        token: "expired-token",
        expiresAt: Date.now() - 1000,
        clientSecret: null,
        refreshToken: null,
        network: "internal",
      },
      req: { headers: {}, socket: {} },
    });

    expect(getAccessTokenForClient).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        clientSecret: null,
        network: null,
        req: expect.any(Object),
      })
    );
    expect(upsertCredentialSessionEntry).toHaveBeenCalledWith(
      expect.any(Object),
      "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      expect.objectContaining({
        token: "renewed-token",
        expiresAt: expect.any(Number),
        network: "internal",
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: 200,
        token: "renewed-token",
        entry: expect.objectContaining({
          token: "renewed-token",
        }),
      })
    );
  });
});
