jest.mock("nookies", () => ({
  parseCookies: jest.fn(),
  setCookie: jest.fn(),
  destroyCookie: jest.fn(),
}));

jest.mock("dbc-node-logger", () => ({
  log: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../../src/datasources/redis.datasource", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

describe("credentialSession", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalRedisEnabled = process.env.REDIS_ENABLED;
  const originalSecret = process.env.WEBSITE_CREDENTIALS_SECRET;

  beforeEach(() => {
    process.env.REDIS_ENABLED = "true";
    process.env.WEBSITE_CREDENTIALS_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.REDIS_ENABLED = originalRedisEnabled;
    process.env.WEBSITE_CREDENTIALS_SECRET = originalSecret;
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("returns false for forwarded http requests in production", () => {
    process.env.NODE_ENV = "production";
    const { shouldUseSecureCookies } = require("../credentialSession");

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
    const { shouldUseSecureCookies } = require("../credentialSession");

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
    const { shouldUseSecureCookies } = require("../credentialSession");

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
    const { shouldUseSecureCookies } = require("../credentialSession");

    process.env.NODE_ENV = "production";
    expect(shouldUseSecureCookies({ req: { headers: {} } })).toBe(true);

    process.env.NODE_ENV = "development";
    expect(shouldUseSecureCookies({ req: { headers: {} } })).toBe(false);
  });

  test("logs when a session cookie exists but redis is empty and no backup can recover it", async () => {
    const { parseCookies } = require("nookies");
    const { get } = require("../../../../src/datasources/redis.datasource");
    const { log } = require("dbc-node-logger");
    const { getCredentialSession } = require("../credentialSession");

    parseCookies.mockReturnValue({
      fbi_credentials_session: "session-123",
    });
    get.mockResolvedValue(null);

    const result = await getCredentialSession({ req: { headers: {} } });

    expect(result).toEqual({
      sessionId: null,
      session: { entries: {} },
    });
    expect(log.warn).toHaveBeenCalledWith(
      "credential_session_missing_in_redis",
      expect.objectContaining({
        component: "credential_session",
        hasSessionCookie: true,
        hasBackupCookie: false,
        redisHit: false,
        entryCount: 0,
      })
    );
    expect(log.warn).toHaveBeenCalledWith(
      "credential_session_empty_result",
      expect.objectContaining({
        component: "credential_session",
        outcome: "redis_miss_without_recovery",
      })
    );
  });

  test("logs when backup cookie cannot be restored", async () => {
    const { parseCookies } = require("nookies");
    const { log } = require("dbc-node-logger");
    const { getCredentialSession } = require("../credentialSession");

    parseCookies.mockReturnValue({
      fbi_credentials_backup: "broken.payload",
    });

    const result = await getCredentialSession({ req: { headers: {} } });

    expect(result).toEqual({
      sessionId: null,
      session: { entries: {} },
    });
    expect(log.warn).toHaveBeenCalledWith(
      "credential_backup_restore_failed",
      expect.objectContaining({
        component: "credential_session",
        outcome: "invalid_backup_payload",
        hasBackupCookie: true,
      })
    );
  });
});
