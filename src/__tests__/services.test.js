import config from "../config";
import services, { getServices } from "../services";

describe("/services", () => {
  it("groups configured URLs by team and sorts services, including SOAP and disabled services", () => {
    const result = getServices({
      z: { teamLabel: "b", url: "https://z.example/", disabled: true },
      culr: {
        teamLabel: "a",
        url: "https://culr.example/api",
        soap_url: "https://culr.example/soap?wsdl",
        password: "secret",
      },
      a: { teamLabel: "b", url: "https://a.example/", enabled: false },
      redis: { teamLabel: "b", host: "redis", port: 6379 },
      other: { url: "https://other.example/" },
    });
    expect(Object.keys(result)).toEqual(["a", "b", "unknown"]);
    expect(result.a).toEqual([
      {
        name: "culr",
        urls: {
          url: "https://culr.example/api",
          soap_url: "https://culr.example/soap?wsdl",
        },
      },
    ]);
    expect(result.b).toEqual([
      {
        name: "a",
        urls: { url: "https://a.example/" },
        enabled: false,
      },
      {
        name: "z",
        urls: { url: "https://z.example/" },
        enabled: false,
      },
    ]);
  });

  it("does not expose credentials, query values, fragments or invalid URLs", () => {
    const result = getServices({
      service: {
        teamLabel: "team",
        url: "https://user:secret@example.org/api?key=secret&key=another#secret",
        soap_url: "invalid secret",
        token: "secret",
        password: "secret",
      },
    });
    expect(result.team[0].urls).toEqual({
      url: "https://example.org/api?key=%5BREDACTED%5D",
      soap_url: null,
    });
    expect(JSON.stringify(result)).not.toMatch(/secret|another|password|token/);
    expect(
      getServices({ bad: { url: "file:///etc/passwd" } }).unknown[0].urls.url
    ).toBeNull();
  });

  it("responds using the loaded configuration and prevents caching", () => {
    const res = { set: jest.fn(), json: jest.fn() };
    services({}, res);
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.json).toHaveBeenCalledWith(getServices(config.datasources));
    expect(
      res.json.mock.calls[0][0].fbiscrum.some(({ name }) => name === "culr")
    ).toBe(true);
  });
});
