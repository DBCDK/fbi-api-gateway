import { parseResponse } from "../../datasources/ris.datasource";

const formattedRis = `TY  - MPCT
ID  - 870970-basis:29913285
TI  - Stand-up.dk, 7. sæson
ER  -
`;

test("parseResponse", () => {
  const actual = parseResponse({
    body: {
      content: {
        "reference-data": formattedRis,
      },
    },
  });

  expect(actual).toEqual(formattedRis);
});

test("parseResponse returns empty string when reference-data is missing", () => {
  expect(parseResponse({ body: {} })).toEqual("");
});
