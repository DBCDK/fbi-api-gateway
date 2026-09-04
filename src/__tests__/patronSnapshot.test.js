import {
  buildPatronMaterialSnapshot,
  resolvers,
} from "../schema/patron/snapshot";

describe("Patron material snapshot", () => {
  test("stores general and specific material type codes and displays", () => {
    expect(
      buildPatronMaterialSnapshot(
        {
          materialTypes: [
            {
              general: { code: "AUDIO_BOOKS", display: "Lydbøger" },
              specific: { code: "AUDIO_BOOK", display: "Lydbog" },
            },
          ],
        },
        { includeMaterialTypes: true }
      ).materialTypes
    ).toEqual([
      {
        materialTypeGeneral: {
          code: "AUDIO_BOOKS",
          display: "Lydbøger",
        },
        materialTypeSpecific: {
          code: "AUDIO_BOOK",
          display: "Lydbog",
        },
      },
    ]);
  });

  test("returns an empty materialTypes list for older snapshots", () => {
    expect(resolvers.PatronMaterialSnapshot.materialTypes({})).toEqual([]);
  });

  test("groups flat UserData periodical fields in PeriodicalSnapshot", () => {
    expect(
      resolvers.PatronMaterialSnapshot.periodical({
        edition: "Årg. 10",
        pages: "S. 12-15",
        publisher: "Eksempelbladet",
        language: "dan",
      })
    ).toEqual({
      edition: "Årg. 10",
      pages: "S. 12-15",
      publisher: "Eksempelbladet",
      language: "dan",
    });
  });

  test("returns no PeriodicalSnapshot without periodical metadata", () => {
    expect(
      resolvers.PatronMaterialSnapshot.periodical({ title: "En bog" })
    ).toBeNull();
  });

  test("pid resolves directly from bookmark pid material id", async () => {
    const result = await resolvers.PatronMaterialSnapshot.pid(
      { _sourceMaterialId: "pid:123" },
      {},
      { datasources: { getLoader: jest.fn() } }
    );

    expect(result).toBe("pid:123");
  });

  test("pid resolves to null for bookmark work ids", async () => {
    const result = await resolvers.PatronMaterialSnapshot.pid(
      { _sourceMaterialId: "work-of:123" },
      {},
      { datasources: { getLoader: jest.fn() } }
    );

    expect(result).toBeNull();
  });

  test("workId resolves directly from bookmark work material id", async () => {
    const result = await resolvers.PatronMaterialSnapshot.workId(
      { _sourceMaterialId: "work-of:123" },
      {},
      { datasources: { getLoader: jest.fn() } }
    );

    expect(result).toBe("work-of:123");
  });

  test("loan snapshot pid resolves via faustToPid", async () => {
    const result = await resolvers.PatronMaterialSnapshot.pid(
      { _sourceFaust: "142526328" },
      {},
      {
        profile: { agency: "123456", name: "test-profile" },
        datasources: {
          getLoader: jest.fn(() => ({
            load: jest.fn().mockResolvedValue("870970-basis:142526328"),
          })),
        },
      }
    );

    expect(result).toBe("870970-basis:142526328");
  });

  test("loan snapshot workId resolves via faustToWorkId", async () => {
    const result = await resolvers.PatronMaterialSnapshot.workId(
      { _sourceFaust: "142526328" },
      {},
      {
        profile: { agency: "123456", name: "test-profile" },
        datasources: {
          getLoader: jest.fn(() => ({
            load: jest.fn().mockResolvedValue("work-of:870970-basis:142526328"),
          })),
        },
      }
    );

    expect(result).toBe("work-of:870970-basis:142526328");
  });
});
