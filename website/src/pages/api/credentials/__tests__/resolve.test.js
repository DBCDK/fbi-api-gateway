jest.mock("../../../../lib/credentialProviders", () => ({
  attachCredentialTraceId: jest.fn((_res, traceId) => traceId),
  buildConfigurationResponse: jest.fn(),
  buildUserResponse: jest.fn(),
  getCredentialTraceId: jest.fn(() => "trace-test-123"),
  getAccessTokenForClient: jest.fn(),
  getRequestIp: jest.fn(() => "127.0.0.1"),
  isInternalRequest: jest.fn(() => false),
}));

jest.mock("../../../../lib/credentialSession", () => ({
  getCredentialSessionEntry: jest.fn(),
  upsertCredentialSessionEntry: jest.fn(),
}));

const handler = require("../resolve").default;
const {
  buildConfigurationResponse,
  buildUserResponse,
} = require("../../../../lib/credentialProviders");
const {
  getCredentialSessionEntry,
  upsertCredentialSessionEntry,
} = require("../../../../lib/credentialSession");

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

    buildConfigurationResponse.mockResolvedValue({
      status: 200,
      body: {
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        profiles: ["bibdk21"],
        agency: "190101",
        supportsRefreshToken: false,
      },
    });
    buildUserResponse.mockResolvedValue({
      status: 200,
      body: {},
    });
    upsertCredentialSessionEntry.mockImplementation(async (_ctx, id, entry) => ({
      id,
      ...entry,
    }));
    getCredentialSessionEntry.mockResolvedValue(null);
  });

  test("resolves token submissions into canonical client entries when configuration exposes a clientId", async () => {
    const req = {
      method: "POST",
      body: {
        value: "af20a0ff1d6c7dde6d00d04b433a1204d3c086cc",
        agency: "190101",
      },
      headers: {},
      socket: {},
      res: {},
    };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(upsertCredentialSessionEntry).toHaveBeenCalledWith(
      expect.any(Object),
      "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      expect.objectContaining({
        type: "client",
        token: "af20a0ff1d6c7dde6d00d04b433a1204d3c086cc",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      })
    );
    expect(res.body.safeEntry).toEqual(
      expect.objectContaining({
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        type: "client",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        token: "af20a0ff1d6c7dde6d00d04b433a1204d3c086cc",
      })
    );
  });

  test("resolves internal clientId submissions without blocking on configuration enrichment", async () => {
    const req = {
      method: "POST",
      body: {
        value: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        agency: "190101",
      },
      headers: {},
      socket: {},
      res: {},
    };
    const res = createResponse();
    const {
      getAccessTokenForClient,
      isInternalRequest,
    } = require("../../../../lib/credentialProviders");

    isInternalRequest.mockReturnValue(true);
    getAccessTokenForClient.mockResolvedValue({
      status: 200,
      token: "resolved-internal-token",
      tokenType: "Bearer",
      refreshToken: null,
      expiresAt: "2026-06-10T12:00:00.000Z",
    });

    buildConfigurationResponse.mockClear();
    buildUserResponse.mockClear();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(getAccessTokenForClient).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        network: "internal",
      })
    );
    expect(buildConfigurationResponse).not.toHaveBeenCalled();
    expect(buildUserResponse).not.toHaveBeenCalled();
    expect(upsertCredentialSessionEntry).toHaveBeenCalledWith(
      expect.any(Object),
      "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      expect.objectContaining({
        type: "client",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        token: "resolved-internal-token",
        agency: "190101",
        status: "OK",
      })
    );
    expect(res.body.safeEntry).toEqual(
      expect.objectContaining({
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        type: "client",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        token: "resolved-internal-token",
        agency: "190101",
        status: "OK",
      })
    );
  });

  test("resolves token submissions even when user enrichment fails", async () => {
    const req = {
      method: "POST",
      body: {
        value: "af20a0ff1d6c7dde6d00d04b433a1204d3c086cc",
        agency: "190101",
      },
      headers: {},
      socket: {},
      res: {},
    };
    const res = createResponse();

    buildUserResponse.mockRejectedValue(new Error("userinfo timeout"));

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("OK");
    expect(res.body.safeEntry).toEqual(
      expect.objectContaining({
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        token: "af20a0ff1d6c7dde6d00d04b433a1204d3c086cc",
      })
    );
  });
});
