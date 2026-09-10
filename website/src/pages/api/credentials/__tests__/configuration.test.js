jest.mock("../../../../lib/credentialAccess", () => ({
  resolveCredentialAccessToken: jest.fn(),
}));

jest.mock("../../../../lib/credentialProviders", () => ({
  buildConfigurationResponse: jest.fn(),
  isInternalRequest: jest.fn(),
}));

jest.mock("../../../../lib/credentialSession", () => ({
  getCredentialSessionEntry: jest.fn(),
}));

const handler = require("../configuration").default;
const {
  buildConfigurationResponse,
  isInternalRequest,
} = require("../../../../lib/credentialProviders");
const {
  getCredentialSessionEntry,
} = require("../../../../lib/credentialSession");
const {
  resolveCredentialAccessToken,
} = require("../../../../lib/credentialAccess");

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

describe("/api/credentials/configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCredentialSessionEntry.mockResolvedValue({
      type: "client",
      clientId: "example-client-id",
      clientSecret: "saved-secret",
      refreshToken: "saved-refresh-token",
      token: "resolved-token",
      expiresAt: 1780000000000,
    });
    resolveCredentialAccessToken.mockResolvedValue({
      status: 200,
      token: "resolved-token",
      entry: {
        id: "client:example-client-id",
        type: "client",
        clientId: "example-client-id",
        clientSecret: "saved-secret",
        refreshToken: "saved-refresh-token",
        expiresAt: 1780000000000,
      },
    });
    buildConfigurationResponse.mockResolvedValue({
      status: 200,
      body: {
        clientId: "example-client-id",
        supportsRefreshToken: true,
      },
    });
    isInternalRequest.mockReturnValue(false);
  });

  test("returns resolved secret state from a stored session entry", async () => {
    const req = {
      method: "GET",
      query: {
        entryId: "client:example-client-id",
      },
      headers: {},
      res: {},
    };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        resolvedHasClientSecret: true,
        resolvedHasRefreshToken: true,
        resolvedClientId: "example-client-id",
        resolvedCanAutoRefresh: true,
      })
    );
  });
});
