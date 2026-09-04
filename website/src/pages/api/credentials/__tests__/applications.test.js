jest.mock("../../../../lib/credentialSession", () => ({
  getCredentialSession: jest.fn(),
  removeCredentialSessionEntry: jest.fn(),
  upsertCredentialSessionEntry: jest.fn(),
}));

jest.mock("../../../../../../src/config.js", () => ({
  credentials: {
    maxClientEntries: 10,
  },
}));

jest.mock("../../../../lib/credentialApplications", () => ({
  listApplicationEntries: jest.fn(),
}));

const handler = require("../applications").default;
const { getCredentialSession } = require("../../../../lib/credentialSession");
const {
  listApplicationEntries,
} = require("../../../../lib/credentialApplications");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("/api/credentials/applications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns the runtime application limit with the applications", async () => {
    const entries = {
      "client:example-client-id": {
        type: "client",
        clientId: "example-client-id",
      },
    };
    const applications = [
      {
        id: "client:example-client-id",
        type: "client",
        clientId: "example-client-id",
      },
    ];
    getCredentialSession.mockResolvedValue({ session: { entries } });
    listApplicationEntries.mockReturnValue(applications);
    const req = { method: "GET" };
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      applications,
      maxClientEntries: 10,
    });
  });
});
