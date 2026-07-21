jest.mock("nookies", () => ({
  parseCookies: jest.fn(),
  setCookie: jest.fn(),
  destroyCookie: jest.fn(),
}));

jest.mock("../../../../src/datasources/redis.datasource", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

function loadCredentialSessionModule() {
  jest.resetModules();
  process.env.REDIS_ENABLED = "true";
  process.env.WEBSITE_CREDENTIALS_SECRET = "test-secret";
  return require("../credentialSession");
}

describe("credentialSession", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalRedisEnabled = process.env.REDIS_ENABLED;
  const originalSecret = process.env.WEBSITE_CREDENTIALS_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.REDIS_ENABLED = "true";
    process.env.WEBSITE_CREDENTIALS_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.REDIS_ENABLED = originalRedisEnabled;
    process.env.WEBSITE_CREDENTIALS_SECRET = originalSecret;
    jest.restoreAllMocks();
  });

  test("returns false for forwarded http requests in production", () => {
    process.env.NODE_ENV = "production";
    const { shouldUseSecureCookies } = loadCredentialSessionModule();

    expect(
      shouldUseSecureCookies({
        req: {
          headers: {
            "x-forwarded-proto": "http",
          },
        },
      })
    ).toBe(false);
  });

  test("returns true for forwarded https requests in production", () => {
    process.env.NODE_ENV = "production";
    const { shouldUseSecureCookies } = loadCredentialSessionModule();

    expect(
      shouldUseSecureCookies({
        req: {
          headers: {
            "x-forwarded-proto": "https",
          },
        },
      })
    ).toBe(true);
  });

  test("returns true when forwarded header reports https", () => {
    process.env.NODE_ENV = "production";
    const { shouldUseSecureCookies } = loadCredentialSessionModule();

    expect(
      shouldUseSecureCookies({
        req: {
          headers: {
            forwarded: "for=192.0.2.60;proto=https;by=203.0.113.43",
          },
        },
      })
    ).toBe(true);
  });

  test("falls back to NODE_ENV when protocol is unavailable", () => {
    const { shouldUseSecureCookies } = loadCredentialSessionModule();

    process.env.NODE_ENV = "production";
    expect(shouldUseSecureCookies({ req: { headers: {} } })).toBe(true);

    process.env.NODE_ENV = "development";
    expect(shouldUseSecureCookies({ req: { headers: {} } })).toBe(false);
  });

  test("writes one-year TTL for stored sessions", async () => {
    const { setCredentialSession } = loadCredentialSessionModule();
    const { parseCookies, setCookie } = require("nookies");
    const { set } = require("../../../../src/datasources/redis.datasource");

    parseCookies.mockReturnValue({});
    set.mockResolvedValue();

    await setCredentialSession(
      { req: { headers: {} }, res: {} },
      {
        entries: {
          "client:abc": {
            type: "client",
            clientId: "abc",
            updatedAt: 123,
          },
        },
      }
    );

    expect(set).toHaveBeenCalledWith(
      expect.stringMatching(/^credential_session_/),
      31536000,
      expect.objectContaining({
        entries: expect.objectContaining({
          "client:abc": expect.objectContaining({
            clientId: "abc",
          }),
        }),
      })
    );
    expect(setCookie).toHaveBeenCalledWith(
      expect.any(Object),
      "fbi_credentials_session",
      expect.any(String),
      expect.objectContaining({
        maxAge: 31536000,
      })
    );
  });

  test("refreshes an active redis session at most once per day", async () => {
    const now = Date.UTC(2026, 6, 20, 10, 0, 0);
    const { getCredentialSession } = loadCredentialSessionModule();
    const { parseCookies, setCookie } = require("nookies");
    const { get, set } = require("../../../../src/datasources/redis.datasource");

    jest.spyOn(Date, "now").mockReturnValue(now);
    parseCookies.mockReturnValue({
      fbi_credentials_session: "session-123",
    });
    get.mockResolvedValue({
      val: {
        entries: {
          "client:abc": {
            type: "client",
            clientId: "abc",
            updatedAt: now - 1000,
          },
        },
        touchedAt: now - 86400000 - 1,
      },
    });
    set.mockResolvedValue();

    const result = await getCredentialSession({
      req: { headers: {} },
      res: {},
    });

    expect(result.sessionId).toBe("session-123");
    expect(set).toHaveBeenCalledWith(
      "credential_session_session-123",
      31536000,
      expect.objectContaining({
        touchedAt: now,
      })
    );
    expect(setCookie).toHaveBeenCalledTimes(2);
  });

  test("does not refresh a redis session again within the same day", async () => {
    const now = Date.UTC(2026, 6, 20, 10, 0, 0);
    const { getCredentialSession } = loadCredentialSessionModule();
    const { parseCookies, setCookie } = require("nookies");
    const { get, set } = require("../../../../src/datasources/redis.datasource");

    jest.spyOn(Date, "now").mockReturnValue(now);
    parseCookies.mockReturnValue({
      fbi_credentials_session: "session-123",
    });
    get.mockResolvedValue({
      val: {
        entries: {
          "client:abc": {
            type: "client",
            clientId: "abc",
            updatedAt: now - 1000,
          },
        },
        touchedAt: now - 3600000,
      },
    });

    const result = await getCredentialSession({
      req: { headers: {} },
      res: {},
    });

    expect(result.sessionId).toBe("session-123");
    expect(set).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });

});
