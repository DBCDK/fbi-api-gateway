import { performTestQuery } from "../utils/utils";
import { resolvers } from "../schema/patron/loans";

test("exposes stored provenance and metadata without inventing missing snapshot data", async () => {
  const items = [
    {
      id: "manual-loan",
      materialId: "23424916",
      materialIdType: "FAUST",
      clientId: "history-client",
      isManuallyAdded: true,
      snapshot: {
        title: "Stored title",
        materialTypes: [{ materialTypeSpecific: { code: "BOOK" } }],
      },
    },
    {
      id: "stream-loan",
      materialId: "870970-basis:23424916",
      materialIdType: "PID",
      clientId: null,
      isManuallyAdded: false,
      snapshot: null,
    },
  ];
  const load = jest.fn().mockResolvedValue({ hitcount: 2, items });
  const loadClient = jest.fn().mockResolvedValue({
    config: { gateway: { bookmarks: { app: "BIBLIOTEKDK" } } },
  });
  const result = await performTestQuery({
    query: `{
      patron {
        historicalLoans {
          items {
            materialId application isManuallyAdded
            snapshot {
              title
              materialTypes {
                materialTypeGeneral { code display }
                materialTypeSpecific { code display }
              }
            }
          }
        }
      }
    }`,
    context: {
      accessToken: "DUMMY_TOKEN",
      user: { uniqueId: "test-user" },
      datasources: {
        getLoader: jest.fn((name) => ({
          load: name === "authAdminClient" ? loadClient : load,
        })),
      },
    },
  });
  expect(result.errors).toBeUndefined();
  expect(result.data.patron.historicalLoans.items).toEqual([
    {
      materialId: "23424916",
      application: "BIBLIOTEKDK",
      isManuallyAdded: true,
      snapshot: {
        title: "Stored title",
        materialTypes: [
          {
            materialTypeGeneral: { code: null, display: null },
            materialTypeSpecific: { code: "BOOK", display: null },
          },
        ],
      },
    },
    {
      materialId: "870970-basis:23424916",
      application: null,
      isManuallyAdded: false,
      snapshot: { title: null, materialTypes: null },
    },
  ]);
  expect(load).toHaveBeenCalledTimes(1);
  expect(loadClient).toHaveBeenCalledTimes(1);
  expect(loadClient).toHaveBeenCalledWith("history-client");
});

test("application handles array responses, missing configuration and auth errors", async () => {
  const load = jest
    .fn()
    .mockResolvedValueOnce([
      { config: { gateway: { bookmarks: { app: "BIBLIOTEKDK" } } } },
    ])
    .mockResolvedValueOnce({ config: {} })
    .mockResolvedValueOnce(null)
    .mockRejectedValueOnce(new Error("Auth unavailable"));
  const context = { datasources: { getLoader: () => ({ load }) } };
  for (const expected of ["BIBLIOTEKDK", null, null, null]) {
    await expect(
      resolvers.HistoricalLoan.application(
        { clientId: "history-client" },
        {},
        context
      )
    ).resolves.toBe(expected);
  }
});
