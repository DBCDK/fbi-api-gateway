jest.mock("../../../../lib/credentialProviders", () => ({
  getAccessTokenForClient: jest.fn(),
}));

jest.mock("../../../../lib/credentialSession", () => ({
  getCredentialSessionEntry: jest.fn(),
  upsertCredentialSessionEntry: jest.fn(),
}));

const handler = require("../client-secret").default;
const {
  getAccessTokenForClient,
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

describe("/api/credentials/client-secret", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getCredentialSessionEntry.mockResolvedValue({
      id: "client:example-client-id",
      type: "client",
      clientId: "example-client-id",
      profile: "bibdk21",
      agency: "190101",
      requiresClientSecret: true,
      status: "CLIENT_SECRET_REQUIRED",
    });

    getAccessTokenForClient.mockResolvedValue({
      status: 200,
      token: "resolved-token",
      tokenType: "Bearer",
      expiresAt: "2026-06-10T12:00:00.000Z",
    });

    upsertCredentialSessionEntry.mockImplementation(async (_ctx, id, entry) => ({
      id,
      ...entry,
    }));
  });

  test("returns a validated safe entry without waiting for configuration enrichment", async () => {
    const req = {
      method: "POST",
      body: {
        entryId: "client:example-client-id",
        clientSecret: "real-client-secret",
        agency: "190101",
      },
      headers: {},
      res: {},
    };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(getAccessTokenForClient).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "example-client-id",
        clientSecret: "real-client-secret",
        network: null,
      })
    );
    expect(upsertCredentialSessionEntry).toHaveBeenCalledWith(
      expect.any(Object),
      "client:example-client-id",
      expect.objectContaining({
        token: "resolved-token",
        clientSecret: "real-client-secret",
        requiresClientSecret: false,
        status: "OK",
      })
    );
    expect(res.body.safeEntry).toEqual(
      expect.objectContaining({
        id: "client:example-client-id",
        type: "client",
        token: "resolved-token",
        clientId: "example-client-id",
        hasClientSecret: true,
        profile: "bibdk21",
        agency: "190101",
        status: "OK",
      })
    );
  });

  test("removes an attached client secret and keeps the entry available", async () => {
    const req = {
      method: "DELETE",
      body: {
        entryId: "client:example-client-id",
      },
      headers: {},
      res: {},
    };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(getAccessTokenForClient).not.toHaveBeenCalled();
    expect(upsertCredentialSessionEntry).toHaveBeenCalledWith(
      expect.any(Object),
      "client:example-client-id",
      expect.objectContaining({
        clientSecret: null,
        refreshToken: null,
        requiresClientSecret: false,
        status: "OK",
      })
    );
    expect(res.body.safeEntry).toEqual(
      expect.objectContaining({
        id: "client:example-client-id",
        clientId: "example-client-id",
        hasClientSecret: false,
        status: "OK",
      })
    );
  });
});
