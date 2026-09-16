import config from "../../config";
import { load } from "../authAdminClient.datasource";

describe("Auth Admin client datasource", () => {
  const original = { ...config.datasources.authAdmin };

  beforeEach(() => {
    Object.assign(config.datasources.authAdmin, {
      url: "https://auth-admin.example",
      user: "admin-user",
      password: "admin-password",
    });
  });

  afterAll(() => {
    Object.assign(config.datasources.authAdmin, original);
  });

  test("fetches an encoded client id using basic auth", async () => {
    const fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { displayName: "Example client" },
    });

    await expect(load("client/one", { fetch })).resolves.toEqual({
      displayName: "Example client",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://auth-admin.example/clients/client%2Fone",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from(
            "admin-user:admin-password"
          ).toString("base64")}`,
        }),
      })
    );
  });

  test("rejects when credentials are not configured so null is not cached", async () => {
    config.datasources.authAdmin.user = undefined;
    const fetch = jest.fn();

    await expect(load("client-one", { fetch })).rejects.toMatchObject({
      code: "AUTH_ADMIN_NOT_CONFIGURED",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("returns null for an unknown client", async () => {
    const fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(load("missing", { fetch })).resolves.toBeNull();
  });
});
