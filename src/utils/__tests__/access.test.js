import { getProxyUrl, parseOnlineUrlToOrigin } from "../access";

describe("parseOnlineUrlToOrigin", () => {
  test("decodes an internationalized domain name", () => {
    expect(
      parseOnlineUrlToOrigin("https://xn--brnebiffen-0cb.dk/vaerk/103984")
    ).toBe("børnebiffen.dk");
  });

  test("preserves the port when decoding the hostname", () => {
    expect(
      parseOnlineUrlToOrigin("https://xn--brnebiffen-0cb.dk:8443/vaerk/103984")
    ).toBe("børnebiffen.dk:8443");
  });

  test("preserves the DBC Webarkiv display name", () => {
    expect(
      parseOnlineUrlToOrigin("https://fbi-arkiv.dbc.dk/resource")
    ).toBe("DBC Webarkiv");
  });
});

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
        "https://bib376.bibbaser.dk/login?qurl=https%3A%2F%2Flink.gale.com%2Fapps%2Fdoc%2FEJ2156000312%2FSUIC%3Fsid%3DDDB%26u%3D45nykob",
      loginRequired: true,
    });

    expect(new URL(result.proxyUrl).searchParams.get("qurl")).toBe(
      "https://link.gale.com/apps/doc/EJ2156000312/SUIC?sid=DDB&u=45nykob"
    );
  });

  test("returns null proxy url but still requires login when agency has no configured Gale provider library id", () => {
    const url =
      "https://link.gale.com/apps/doc/EJ2156000312/SUIC?sid=DDB&u=[PROVIDERSLIBRARYID]";

    const result = getProxyUrl(url, {
      userId: "some-user",
      municipality: "787",
      municipalityAgencyId: "778700",
    });

    expect(result).toEqual({
      proxyUrl: null,
      loginRequired: true,
    });
  });

  test("returns null proxy url but still requires login when collection access does not match", () => {
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
      proxyUrl: null,
      loginRequired: true,
    });
  });

  test("returns null proxy url for non-proxy resources", () => {
    const url = "https://example.com/resource";

    const result = getProxyUrl(url, {
      userId: "some-user",
      municipality: "376",
      municipalityAgencyId: "737600",
    });

    expect(result).toEqual({
      proxyUrl: null,
      loginRequired: false,
    });
  });
});
