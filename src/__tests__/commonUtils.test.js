import { parseClientPermissions } from "../../commonUtils";

describe("Permissions", () => {
  test("admin set to true in smaug configuration", async () => {
    const result = parseClientPermissions({
      smaug: { gateway: { admin: true } },
    });
    expect(result).toMatchSnapshot();
  });
  test("no gateway object in smaug configuration gives default permissions", async () => {
    const result = parseClientPermissions({
      smaug: {},
    });
    expect(result).toMatchSnapshot();
  });
  test("Empty gateway object in smaug configuration gives default permissions", async () => {
    const result = parseClientPermissions({
      smaug: { gateway: {} },
    });
    expect(result).toMatchSnapshot();
  });
  test("Role from gateway object in smaug configuration gives the roles' permissions", async () => {
    const result = parseClientPermissions({
      smaug: { gateway: { role: "ddbcms" } },
    });
    expect(result).toMatchSnapshot();
  });
  test("Unknown role from gateway object in smaug configuration gives default permissions", async () => {
    const result = parseClientPermissions({
      smaug: { gateway: { role: "unknown" } },
    });
    expect(result).toMatchSnapshot();
  });
  test("Explicitly setting allowRootFields in gateway object in smaug configuration gives those permissions", async () => {
    const result = parseClientPermissions({
      smaug: { gateway: { allowRootFields: ["manifestation"] } },
    });
    expect(result).toMatchSnapshot();
  });
});
