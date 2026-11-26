import config from "../../config";
import { load } from "../../datasources/label.datasource";
import { resolvers } from "../../schema/manifestationLabel";

const pid = "870970-basis:29913285";
const content = {
  faust: "29913285",
  title: {
    label: ["Stand-up.dk", "(7. sæson)", "1. disk"],
    spine: ["Stand-up.dk", "(7. sæson)", "1. disk"],
  },
  physicalDescription: { attachments: "", materialUnits: "1 dvd-video" },
  classificationForShelf: { label: "77.56", spine: "77.56" },
};

test("load fetches label from metadata-presentation", async () => {
  const context = {
    fetch: jest.fn().mockResolvedValue({ body: { content } }),
  };

  await expect(load({ pid }, context)).resolves.toEqual(content);

  expect(context.fetch).toHaveBeenCalledWith(
    `${config.datasources.metadataPresentation.url}/presentations/label/${encodeURIComponent(pid)}`,
    {
      headers: {
        accept: "application/json",
      },
      allowedErrorStatusCodes: [404],
    }
  );
});

test("load returns null when presentation is not found", async () => {
  const context = {
    fetch: jest
      .fn()
      .mockResolvedValue({ status: 404, body: "<html>Not Found</html>" }),
  };

  await expect(load({ pid }, context)).resolves.toBeNull();
});

test("resolvers normalize missing and empty values", () => {
  expect(resolvers.ManifestationLabelData.edition({})).toEqual([]);
  expect(
    resolvers.ManifestationLabelData.edition({ edition: "1. udgave" })
  ).toEqual(["1. udgave"]);
  expect(resolvers.ManifestationLabelTitle.label({ label: "Titel" })).toEqual([
    "Titel",
  ]);
  expect(
    resolvers.ManifestationLabelPhysicalDescription.attachments(
      content.physicalDescription
    )
  ).toBeNull();
  expect(
    resolvers.ManifestationLabelPhysicalDescription.materialUnits(
      content.physicalDescription
    )
  ).toEqual("1 dvd-video");
});
