import config from "../../config";
import { load } from "../../datasources/refworks.datasource";

const pid = "870970-basis:55132194";
const formatted = "RT Book, Whole\nT1 Børnegrisene og det mega store monster\n";

test("load fetches refworks from reference-presentation", async () => {
  const context = {
    fetch: jest.fn().mockResolvedValue({
      body: {
        content: {
          "reference-data": formatted,
        },
      },
    }),
  };

  await expect(load({ pid }, context)).resolves.toEqual(formatted);

  expect(context.fetch).toHaveBeenCalledWith(
    `${config.datasources.referencePresentation.url}/presentations/refworks/${encodeURIComponent(pid)}`,
    {
      headers: {
        accept: "application/json",
      },
      allowedErrorStatusCodes: [404],
    }
  );
});

test("load returns empty string when reference-data is missing", async () => {
  const context = {
    fetch: jest.fn().mockResolvedValue({ body: {} }),
  };

  await expect(load({ pid }, context)).resolves.toEqual("");
});
