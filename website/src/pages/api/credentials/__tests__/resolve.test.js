jest.mock("../../../../lib/credentialProviders", () => ({
  buildConfigurationResponse: jest.fn(),
  buildUserResponse: jest.fn(),
  getAccessTokenForClient: jest.fn(),
  getRequestIp: jest.fn(),
  isInternalRequest: jest.fn(),
}));

jest.mock("../../../../lib/credentialSession", () => ({
  upsertCredentialSessionEntry: jest.fn(),
}));

const handler = require("../resolve").default;
const {
  buildConfigurationResponse,
  buildUserResponse,
  getRequestIp,
  isInternalRequest,
} = require("../../../../lib/credentialProviders");
const { upsertCredentialSessionEntry } = require("../../../../lib/credentialSession");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("/api/credentials/resolve", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestIp.mockReturnValue("127.0.0.1");
    isInternalRequest.mockReturnValue(true);
    buildUserResponse.mockResolvedValue({
      status: 200,
      body: { isAuthenticated: true },
    });
    upsertCredentialSessionEntry.mockImplementation(async (_ctx, id, entry) => ({
      id,
      ...entry,
    }));
  });

  test("canonicalizes a submitted token into a client-backed entry", async () => {
    buildConfigurationResponse.mockResolvedValue({
      status: 200,
      body: {
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        supportsRefreshToken: false,
        profiles: ["bibdk21"],
        agency: "190101",
        expires: "2026-08-03T17:13:54.907Z",
      },
    });

    const req = {
      method: "POST",
      body: {
        value: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
      },
      headers: {},
      socket: {},
    };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(upsertCredentialSessionEntry).toHaveBeenCalledWith(
      expect.any(Object),
      "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      expect.objectContaining({
        type: "client",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
        network: "internal",
        expiresAt: Date.parse("2026-08-03T17:13:54.907Z"),
      })
    );
    expect(res.body.safeEntry).toEqual(
      expect.objectContaining({
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        type: "client",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        network: "internal",
      })
    );
  });
});
