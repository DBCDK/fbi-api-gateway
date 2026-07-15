const {
  listBackupClientIds,
  buildSessionEntriesFromBackupClientIds,
  listApplicationEntries,
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

  test("deduplicates entries for the same clientId and prefers the richer client entry", () => {
    const applications = listApplicationEntries({
      "token:af20a0ff1d6c7dde6d00d04b433a1204d3c086cc": {
        type: "token",
        token: "af20a0ff1d6c7dde6d00d04b433a1204d3c086cc",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        updatedAt: 10,
      },
      "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52": {
        type: "client",
        token: "renewed-token",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        clientSecret: "saved-secret",
        updatedAt: 20,
      },
    });

    expect(applications).toHaveLength(1);
    expect(applications[0]).toEqual(
      expect.objectContaining({
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        type: "client",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        hasClientSecret: true,
        token: "renewed-token",
      })
    );
  });
});
