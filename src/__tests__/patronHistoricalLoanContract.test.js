import fs from "fs";
import path from "path";
import { parse, validate } from "graphql";
import { getExecutableSchema } from "../schemaLoader";
import { performTestQuery } from "../utils/utils";

test("historical loans use the bookmark snapshot contract and documented query", async () => {
  const schema = await getExecutableSchema({
    loadExternal: false,
    clientPermissions: { gateway: { admin: true } },
    hasAccessToken: true,
  });
  const fields = schema.getType("HistoricalLoan").getFields();
  expect(String(fields.snapshot.type)).toBe(
    String(schema.getType("BookmarkItem").getFields().snapshot.type)
  );
  expect(String(fields.isManuallyAdded.type)).toBe("Boolean!");
  expect(fields.manifestation).toBeUndefined();
  expect(fields.origin).toBeUndefined();
  const docs = fs.readFileSync(
    path.join(__dirname, "../../website/src/docs/19.patron.mdx"),
    "utf8"
  );
  for (const name of [
    "Example_PatronHistoricalLoans",
    "Example_AddPatronHistoricalLoans",
    "Example_DeletePatronHistoricalLoans",
  ]) {
    const query = docs.match(
      new RegExp(`(?:query|mutation) ${name}[\\s\\S]*?(?=\\s*\x60})`)
    )[0];
    expect(validate(schema, parse(query))).toEqual([]);
  }
});

test("exposes stored provenance and metadata without inventing missing snapshot data", async () => {
  const items = [
    {
      id: "manual-loan",
      materialId: "23424916",
      materialIdType: "FAUST",
      application: "BIBLIOTEKDK",
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
      application: null,
      isManuallyAdded: false,
      snapshot: null,
    },
  ];
  const load = jest.fn().mockResolvedValue({ hitcount: 2, items });
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
      datasources: { getLoader: jest.fn(() => ({ load })) },
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
});
