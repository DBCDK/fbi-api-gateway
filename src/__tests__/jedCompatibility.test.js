import { performTestQuery } from "../utils/utils";

// Exercise the public schema, including non-null constraints and enum fallbacks.
async function queryRecord(
  record,
  selection,
  workSelection = "genreAndForm genreForm { display }"
) {
  const result = await performTestQuery({
    query: `{
      work(id: "work-of:870970-basis:12345678") { ${workSelection} }
      manifestation(pid: "870970-basis:12345678") { ${selection} }
    }`,
    context: {
      datasources: {
        getLoader(name) {
          if (name !== "jedRecord")
            throw new Error(`Unexpected loader: ${name}`);
          return {
            load: async () => ({ manifestations: { all: {} }, ...record }),
          };
        },
      },
    },
  });
  expect(result.errors).toBeUndefined();
  return result.data;
}

const legacySelection = `
  genreAndForm genreForm { display }
  audience { generalAudience audienceGeneral { display } }
  edition { contributors }
  cataloguedPublicationStatus { code display }
  relatedPublications { heading title issn urls url faust isbn urlText }
`;

test("JED 1.3 and 2.0 expose equivalent legacy fields and new genre/audience fields", async () => {
  const publication = {
    heading: "Fortsættelse af",
    title: ["Tidligere titel"],
    issn: "1234-5678",
    urls: [{ url: "https://example.org/journal" }],
  };
  const oldRecord = {
    genreAndForm: ["romaner"],
    audience: { generalAudience: ["voksne"] },
    edition: { contributors: [] },
    cataloguedPublicationStatus: { code: "NT", display: "Ny titel" },
    relatedPublications: [publication],
  };
  const newRecord = {
    genreForm: [{ display: "romaner" }],
    audience: { audienceGeneral: [{ display: "voksne" }] },
    edition: {},
    materialSelection: {
      cataloguedPublicationStatus: [
        { type: "NEW_TITLE", display: "Ny titel" },
        { type: "NEW_EDITION", display: "Ny udgave" },
      ],
    },
    periodicalTitleHistory: [publication],
  };
  const oldResult = await queryRecord(oldRecord, legacySelection);
  expect(oldResult).toEqual({
    work: { genreAndForm: ["romaner"], genreForm: [{ display: "romaner" }] },
    manifestation: {
      genreAndForm: ["romaner"],
      genreForm: [{ display: "romaner" }],
      audience: {
        generalAudience: ["voksne"],
        audienceGeneral: [{ display: "voksne" }],
      },
      edition: { contributors: [] },
      cataloguedPublicationStatus: { code: "NT", display: "Ny titel" },
      relatedPublications: [
        {
          heading: "Fortsættelse af",
          title: ["Tidligere titel"],
          issn: "1234-5678",
          urls: ["https://example.org/journal"],
          url: "https://example.org/journal",
          faust: null,
          isbn: null,
          urlText: null,
        },
      ],
    },
  });
  expect(await queryRecord(newRecord, legacySelection)).toEqual(oldResult);
});

test("new enum values survive GraphQL serialization and all three status mappings work", async () => {
  const noteTypes = [
    "NUMBERING_AND_DATING",
    "CONNECTION_TO_OTHER_PERIODICALS",
    "PUBLISHED_OTHER_MATERIALTYPE",
    "CAST_AND_SCENES",
  ];
  for (const [type, code] of [
    ["NEW_TITLE", "NT"],
    ["NEW_EDITION", "NU"],
    ["NEW_PRINT", "OP"],
  ]) {
    const result = await queryRecord(
      {
        notes: noteTypes.map((type) => ({ type, display: ["Note"] })),
        classifications: [{ entryType: "NATIONAL_BIBLIOGRAPHY_MAIN_ENTRY" }],
        materialSelection: {
          cataloguedPublicationStatus: [{ type, display: "Status" }],
        },
      },
      `notes { type } classifications { entryType } cataloguedPublicationStatus { code display }`
    );
    expect(result.manifestation).toEqual({
      notes: noteTypes.map((type) => ({ type })),
      classifications: [{ entryType: "NATIONAL_BIBLIOGRAPHY_MAIN_ENTRY" }],
      cataloguedPublicationStatus: { code, display: "Status" },
    });
  }
});

test("missing and explicitly empty JED2 data remain valid without reviving legacy values", async () => {
  const empty = await queryRecord(
    { audience: {}, edition: {} },
    legacySelection
  );
  expect(empty.manifestation).toEqual({
    genreAndForm: [],
    genreForm: [],
    audience: { generalAudience: [], audienceGeneral: [] },
    edition: { contributors: [] },
    cataloguedPublicationStatus: null,
    relatedPublications: [],
  });
  const result = await queryRecord(
    {
      genreForm: [],
      genreAndForm: ["Old genre"],
      audience: { audienceGeneral: [], generalAudience: ["Old audience"] },
      edition: { contributors: ["Existing contributor"] },
      cataloguedPublicationStatus: { code: "NT", display: "Old status" },
      materialSelection: { cataloguedPublicationStatus: [] },
      relatedPublications: [],
      periodicalTitleHistory: [{ heading: "Ignored" }],
    },
    legacySelection
  );
  expect(result).toEqual({
    work: { genreAndForm: [], genreForm: [] },
    manifestation: {
      ...empty.manifestation,
      edition: { contributors: ["Existing contributor"] },
    },
  });
  const partial = await queryRecord(
    {
      periodicalTitleHistory: [{}],
      titles: { tvSeries: {} },
      notes: [{ type: "REFERENCES", display: [] }],
    },
    `relatedPublications { heading title urls url issn faust isbn urlText }
      titles { standard translated tvSeries { danishLaunchTitle } } notes { heading }`
  );
  expect(partial.manifestation).toEqual({
    relatedPublications: [
      {
        heading: "",
        title: [],
        urls: [],
        url: null,
        issn: null,
        faust: null,
        isbn: null,
        urlText: null,
      },
    ],
    titles: {
      standard: null,
      translated: null,
      tvSeries: { danishLaunchTitle: null },
    },
    notes: [{ heading: null }],
  });
});
