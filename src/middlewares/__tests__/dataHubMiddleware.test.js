jest.mock("../../utils/graphQLQueryTools", () => ({
  findAliasesAndArgs: jest.fn(() => ({
    recommend: { args: { limit: 5 } },
  })),
}));
jest.mock("isbot", () => jest.fn(() => false));

import { dataHubMiddleware } from "../dataHubMiddleware";

describe("dataHubMiddleware recommend events", () => {
  test("does not send RECOMMEND event when workId is missing", async () => {
    const datahubLoad = jest.fn();
    const req = {
      headers: {
        "x-session-token": "session-1",
        "x-tracking-consent": "false",
      },
      smaug: { app: { clientId: "fbi-api" } },
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

    dataHubMiddleware(req, null, jest.fn());

    await req.onOperationComplete[0](
      { recommend: { result: [{ reader: ["x"] }] } },
      {},
      "query { recommend { result { reader } } }"
    );

    expect(datahubLoad).not.toHaveBeenCalled();
  });
});
