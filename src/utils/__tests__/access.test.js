import { getProxyUrl } from "../access";

describe("getProxyUrl", () => {
  test("replaces Gale provider library id for known agency", () => {
    const url =
      "https://link.gale.com/apps/doc/EJ2156000312/SUIC?sid=DDB&u=[PROVIDERSLIBRARYID]";

    const result = getProxyUrl(url, {
      userId: "some-user",
      municipality: "376",
      municipalityAgencyId: "737600",
    });

    expect(result).toEqual({
      proxyUrl:
        "https://bib376.bibbaser.dk/login?url=https://link.gale.com/apps/doc/EJ2156000312/SUIC?sid=DDB&u=45nykob",
      loginRequired: true,
    });
  });

  test("returns direct Gale url when agency has no configured Gale provider library id", () => {
    const url =
      "https://link.gale.com/apps/doc/EJ2156000312/SUIC?sid=DDB&u=[PROVIDERSLIBRARYID]";

    const result = getProxyUrl(url, {
      userId: "some-user",
      municipality: "787",
      municipalityAgencyId: "778700",
    });

    expect(result).toEqual({
      proxyUrl: url,
      loginRequired: true,
    });
  });

  test("returns direct Gale url when collection access does not match", () => {
    const url =
      "https://link.gale.com/apps/doc/EJ2156000312/SUIC?sid=DDB&u=[PROVIDERSLIBRARYID]";

    const result = getProxyUrl(
      url,
      {
        userId: "some-user",
        municipality: "376",
        municipalityAgencyId: "737600",
      },
      { collectionIdentifiers: ["150023-biocon"] }
    );

    expect(result).toEqual({
      proxyUrl: url,
      loginRequired: true,
    });
  });

  test("returns direct url for non-proxy resources", () => {
    const url = "https://example.com/resource";

    const result = getProxyUrl(url, {
      userId: "some-user",
      municipality: "376",
      municipalityAgencyId: "737600",
    });

    expect(result).toEqual({
      proxyUrl: url,
      loginRequired: false,
    });
  });
});
