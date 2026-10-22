import config from "../config";
import { load } from "../datasources/authAdminClient.datasource";

test("client lookup uses Auth Admin credentials and handles missing clients and failures", async () => {
  const original = config.datasources.authAdmin;
  config.datasources.authAdmin = {
    url: "https://auth-admin.example/",
    user: "test-user",
    password: "test-password",
  };
  const body = { gateway: { bookmarks: { app: "BIBLIOTEKDK" } } };
  const context = {
    fetch: jest.fn().mockResolvedValue({ ok: true, status: 200, body }),
  };
  try {
    await expect(load("client/id", context)).resolves.toEqual(body);
    expect(context.fetch).toHaveBeenCalledWith(
      "https://auth-admin.example/clients/client%2Fid",
      expect.objectContaining({
        allowedErrorStatusCodes: [404],
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from("test-user:test-password").toString("base64")}`,
        },
      })
    );
    context.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(load("missing", context)).resolves.toBeNull();
    context.fetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(load("unavailable", context)).rejects.toMatchObject({ status: 503 });
  } finally {
    config.datasources.authAdmin = original;
  }
});
