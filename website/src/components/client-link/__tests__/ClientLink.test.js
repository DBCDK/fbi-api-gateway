import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ClientLink from "../ClientLink";
import { useRouter } from "next/router";
import useCredentialResolve from "@/hooks/credentials/useCredentialResolve";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/hooks/credentials/useCredentialResolve", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@/hooks/credentials/useCredentialMutations", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@/components/top/environments", () => ({ __esModule: true, default: () => null }));

global.IS_REACT_ACT_ENVIRONMENT = true;
const originalFetch = global.fetch;
let container, root, resolve, persist, clear, replace;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  resolve = jest.fn(); persist = jest.fn(); clear = jest.fn(); replace = jest.fn();
  useCredentialResolve.mockReturnValue({ resolveCredential: resolve });
  useCredentialMutations.mockReturnValue({ persistResolvedEntry: persist, clearSelectedCredential: clear });
  window.history.replaceState({}, "", "/documentation?clientId=chosen&agency=123&profile=test#section");
  useRouter.mockReturnValue({ isReady: true, asPath: window.location.pathname + window.location.search, query: { clientId: "chosen", agency: "123", profile: "test" }, replace });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ agencies: ["123"], profiles: ["test"] }) });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  global.fetch = originalFetch;
  jest.clearAllMocks();
});
test("resolves the explicit client before showing content and preserves the destination anchor", async () => {
  resolve.mockResolvedValue({ safeEntry: { id: "client:chosen", clientId: "chosen", token: "resolved" } });
  await act(async () => root.render(<React.StrictMode><ClientLink><div>Protected page</div></ClientLink></React.StrictMode>));
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(clear).toHaveBeenCalledTimes(1);
  expect(resolve).toHaveBeenCalledWith({ value: "chosen", clientSecret: undefined });
  expect(persist).toHaveBeenCalledWith(expect.objectContaining({ clientId: "chosen", agency: "123", profile: "test" }), { select: true });
  expect(replace).toHaveBeenCalledWith("/documentation#section", undefined, { scroll: false });
  expect(container.textContent).not.toContain("Protected page");
});
test("a required secret blocks navigation and the previously selected application", async () => {
  resolve.mockResolvedValue({ status: "CLIENT_SECRET_REQUIRED", message: "Client secret required" });
  await act(async () => root.render(<ClientLink><div>Protected page</div></ClientLink>));
  expect(container.textContent).toContain("Client secret required");
  expect(container.querySelector('input[type="password"]')).not.toBeNull();
  expect(container.textContent).not.toContain("Protected page");
  expect(persist).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});
test("unavailable agency and profile require acknowledgement before continuing", async () => {
  resolve.mockResolvedValue({ safeEntry: { id: "client:chosen", token: "resolved" } });
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ agencies: ["456"], profiles: ["fallback"] }) });
  await act(async () => root.render(<ClientLink><div>Page</div></ClientLink>));
  expect(container.textContent).toContain("Agency changed to 456");
  expect(container.textContent).toContain("Profile changed to fallback");
  expect(replace).not.toHaveBeenCalled();
});
