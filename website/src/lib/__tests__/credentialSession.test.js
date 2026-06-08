import { shouldUseSecureCookies } from "../credentialSession";

describe("shouldUseSecureCookies", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("returns false for forwarded http requests in production", () => {
    process.env.NODE_ENV = "production";

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
    process.env.NODE_ENV = "production";
    expect(shouldUseSecureCookies({ req: { headers: {} } })).toBe(true);

    process.env.NODE_ENV = "development";
    expect(shouldUseSecureCookies({ req: { headers: {} } })).toBe(false);
  });
});
