import handler from "../network";
import { isInternalRequest } from "../../../../lib/credentialProviders";

jest.mock("../../../../lib/credentialProviders", () => ({
  getRequestIp: () => "10.0.0.1",
  isInternalRequest: jest.fn(),
}));

it.each([
  ["localhost:3003", "http://localhost:9599"],
  ["127.0.0.1:3001", "http://127.0.0.1:9599"],
  ["[::1]:3003", "http://[::1]:9599"],
  ["fbi-api.dbc.dk", null],
  ["localhost.example.org", null],
])(
  "uses a local monitoring link only for loopback hosts: %s",
  (host, expected) => {
    const original = process.env.INTERNAL_MONITORING_URL;
    delete process.env.INTERNAL_MONITORING_URL;
    try {
      isInternalRequest.mockReturnValue(true);
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      handler({ headers: { host } }, res);
      expect(res.send.mock.calls[0][0].monitoringBaseUrl).toBe(expected);
      isInternalRequest.mockReturnValue(false);
      handler({ headers: { host } }, res);
      expect(res.send.mock.calls[1][0].monitoringBaseUrl).toBeNull();
    } finally {
      if (original !== undefined)
        process.env.INTERNAL_MONITORING_URL = original;
    }
  }
);

it.each([true, false])(
  "provides monitoring links only for internal requests (%s)",
  (internal) => {
    const original = process.env.INTERNAL_MONITORING_URL;
    process.env.INTERNAL_MONITORING_URL = "https://internal.example:9599";
    try {
      isInternalRequest.mockReturnValue(internal);
      const req = {};
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      handler(req, res);
      expect(isInternalRequest).toHaveBeenCalledWith(req, {
        ignoreDisableOverride: true,
      });
      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "private, no-store"
      );
      expect(res.send).toHaveBeenCalledWith({
        detectedIp: "10.0.0.1",
        isInternal: internal,
        monitoringBaseUrl: internal ? "https://internal.example:9599" : null,
      });
    } finally {
      if (original === undefined) delete process.env.INTERNAL_MONITORING_URL;
      else process.env.INTERNAL_MONITORING_URL = original;
    }
  }
);
