import config from "../../config";
import { load as loadUsage } from "../traceqlUsage.datasource";
import { load as loadInsights } from "../traceqlInsights.datasource";

describe("TraceQL datasources", () => {
  test("posts usage with the request access token", async () => {
    const fetch = jest.fn().mockResolvedValue({ ok: true, body: {} });
    const event = { requestId: "request-1", fields: ["Query.work"] };

    await loadUsage(event, { fetch, accessToken: "secret-token" });

    expect(fetch).toHaveBeenCalledWith(
      `${config.datasources.traceql.url}/v1/usage`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
        }),
        body: JSON.stringify(event),
      })
    );
  });

  test("builds an authenticated Insights request", async () => {
    const fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { fields: [] },
    });

    await expect(
      loadInsights(
        {
          path: "/v1/fields",
          params: { from: "2026-09-01T00:00:00.000Z", limit: 100 },
        },
        { fetch, accessToken: "admin-token" }
      )
    ).resolves.toEqual({ fields: [] });

    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain("/v1/fields?");
    expect(url).toContain("limit=100");
    expect(new URL(url).searchParams.get("from")).toBe(
      "2026-09-01T00:00:00.000Z"
    );
    expect(new URL(url).searchParams.has("to")).toBe(false);
    expect(options.headers.Authorization).toBe("Bearer admin-token");
  });

  test("throws a sanitized read error", async () => {
    const fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      body: { code: "ADMIN_ACCESS_REQUIRED", message: "details" },
    });

    await expect(
      loadInsights({ path: "/v1/fields" }, { fetch, accessToken: "token" })
    ).rejects.toMatchObject({
      message: "TraceQL Insights request failed: ADMIN_ACCESS_REQUIRED",
      status: 403,
      code: "ADMIN_ACCESS_REQUIRED",
    });
  });

  test("URL-encodes negative filters and omits empty values", async () => {
    const fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { fields: [] },
    });

    await loadInsights(
      {
        path: "/v1/fields",
        params: {
          excludeClientId: "client/a + b",
          excludeAgencyId: "190101",
          excludeProfileName: "test profile",
          clientId: "",
        },
      },
      { fetch, accessToken: "admin-token" }
    );

    const endpoint = new URL(fetch.mock.calls[0][0]);
    expect(endpoint.searchParams.get("excludeClientId")).toBe("client/a + b");
    expect(endpoint.searchParams.get("excludeAgencyId")).toBe("190101");
    expect(endpoint.searchParams.get("excludeProfileName")).toBe(
      "test profile"
    );
    expect(endpoint.searchParams.has("clientId")).toBe(false);
  });
});
