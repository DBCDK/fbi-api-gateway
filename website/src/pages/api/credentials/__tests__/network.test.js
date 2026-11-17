jest.mock("../../../../../../src/config.js", () => ({ __esModule: true, default: { monitoring: { url: "http://monitor.internal" } } }));
jest.mock("@/lib/credentialProviders", () => ({ getRequestIp: jest.fn(() => "127.0.0.1"), isInternalRequest: jest.fn() }));
import handler from "../network";
import { isInternalRequest } from "@/lib/credentialProviders";
const previous = process.env.WEBSITE_ENVIRONMENTS;
afterEach(() => {
  if (previous === undefined) delete process.env.WEBSITE_ENVIRONMENTS;
  else process.env.WEBSITE_ENVIRONMENTS = previous;
});
test.each([true, false])("internal environment list is only disclosed to internal requests (%s)", (internal) => {
  process.env.WEBSITE_ENVIRONMENTS = JSON.stringify([{ name: "Test", url: "http://test.internal" }]);
  isInternalRequest.mockReturnValue(internal);
  const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
  handler({}, res);
  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ environments: internal ? [{ name: "Test", url: "http://test.internal" }] : [], isInternal: internal }));
  expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
});
