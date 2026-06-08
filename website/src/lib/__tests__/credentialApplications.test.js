const {
  listBackupClientIds,
  buildSessionEntriesFromBackupClientIds,
} = require("../credentialApplications");

describe("credentialApplications backup helpers", () => {
  test("extracts unique clientIds in newest-first order", () => {
    expect(
      listBackupClientIds({
        "client:second": {
          clientId: "second",
          updatedAt: 20,
        },
        "client:first": {
          clientId: "first",
          updatedAt: 10,
        },
        "client:duplicate": {
          clientId: "second",
          updatedAt: 5,
        },
        "token:ignored": {
          token: "abc",
          updatedAt: 30,
        },
      })
    ).toEqual(["second", "first"]);
  });

  test("builds minimal client-backed session entries from backup clientIds", () => {
    const entries = buildSessionEntriesFromBackupClientIds(["first", "second"]);

    expect(Object.keys(entries)).toEqual(["client:first", "client:second"]);
    expect(entries["client:first"]).toEqual(
      expect.objectContaining({
        type: "client",
        clientId: "first",
        token: null,
        clientSecret: null,
        refreshToken: null,
      })
    );
  });
});
