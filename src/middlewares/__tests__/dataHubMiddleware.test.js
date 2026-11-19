jest.mock("../../utils/graphQLQueryTools", () => ({
  findAliasesAndArgs: jest.fn(() => ({
    recommend: { args: { limit: 5 } },
  })),
}));
jest.mock("isbot", () => jest.fn(() => false));
jest.mock("../../config", () => ({
  datasources: { datahub: { ipSalt: "test-salt" } },
}));

import { dataHubMiddleware } from "../dataHubMiddleware";
import { hashMaskedIp } from "../../utils/ip";

function createReq({ datahubLoad, ips } = {}) {
  return {
    headers: {
      "x-session-token": "session-1",
      "x-tracking-consent": "false",
    },
    smaug: { app: { clientId: "fbi-api", ips } },
    profile: { agency: "123456", name: "test-profile" },
    datasources: {
      getLoader: jest.fn((name) => {
        if (name === "datahub") {
          return { load: datahubLoad };
        }
        return { load: jest.fn() };
      }),
    },
    get: jest.fn(() => "Mozilla/5.0"),
  };
}

describe("dataHubMiddleware recommend events", () => {
  test("does not send RECOMMEND event when workId is missing", async () => {
    const datahubLoad = jest.fn();
    const req = createReq({ datahubLoad });

    dataHubMiddleware(req, null, jest.fn());

    await req.onOperationComplete[0](
      { recommend: { result: [{ reader: ["x"] }] } },
      {},
      "query { recommend { result { reader } } }"
    );

    expect(datahubLoad).not.toHaveBeenCalled();
  });
});

describe("dataHubMiddleware context", () => {
  test("adds bot, user agent and ip info to context", async () => {
    const datahubLoad = jest.fn();
    const req = createReq({ datahubLoad, ips: ["10.0.0.1", "8.8.8.8"] });

    dataHubMiddleware(req, null, jest.fn());
    await req.dataHub.createWorkEvent({
      input: { id: "work-of:1" },
      work: { workId: "work-of:1", traceId: "trace-1" },
    });

    expect(datahubLoad.mock.calls[0][0].context).toMatchObject({
      isBot: false,
      userAgent: "Mozilla/5.0",
      hashedMaskedIp: hashMaskedIp("8.8.8.8", "test-salt"),
      ipCountry: "US",
    });
  });

  test("sets nullable fields to null when values are missing", async () => {
    const datahubLoad = jest.fn();
    const req = createReq({ datahubLoad, ips: ["10.0.0.1", "127.0.0.1"] });
    req.get = jest.fn(() => undefined);

    dataHubMiddleware(req, null, jest.fn());
    await req.dataHub.createWorkEvent({
      input: { id: "work-of:1" },
      work: { workId: "work-of:1", traceId: "trace-1" },
    });

    expect(datahubLoad.mock.calls[0][0].context).toMatchObject({
      isBot: false,
      userAgent: null,
      hashedMaskedIp: null,
      ipCountry: null,
    });
  });
});
