import { SWRConfig } from "swr";
import useClientLinkStatus from "../useClientLinkStatus";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import useClientLink from "../useClientLink";
import { useRouter } from "next/router";
import useCredentialEntries from "@/hooks/credentials/useCredentialEntries";
import useCredentialResolve from "@/hooks/credentials/useCredentialResolve";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/hooks/credentials/useCredentialEntries", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@/hooks/credentials/useCredentialResolve", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@/hooks/credentials/useCredentialMutations", () => ({ __esModule: true, default: jest.fn() }));

global.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, resolve, persist, select, clear, replace, swrConfig;
beforeEach(() => {
  swrConfig = { provider: () => new Map() };
  container = document.createElement("div");
  root = createRoot(container);
  resolve = jest.fn(); persist = jest.fn(); select = jest.fn(); clear = jest.fn(); replace = jest.fn();
  useCredentialEntries.mockReturnValue({ applications: [], hasFetchedApplications: true });
  useCredentialResolve.mockReturnValue({ resolveCredential: resolve });
  useCredentialMutations.mockReturnValue({ persistResolvedEntry: persist, selectCredential: select, clearSelectedCredential: clear });
  window.history.replaceState({}, "", "/documentation?clientId=chosen&agency=123&profile=test#section");
  useRouter.mockReturnValue({ isReady: true, asPath: window.location.pathname + window.location.search, query: { clientId: "chosen", agency: "123", profile: "test" }, replace });
});
afterEach(async () => {
  await act(async () => root.unmount());
  jest.clearAllMocks();
});
function TestPage() {
  useClientLink();
  const { isLoading } = useClientLinkStatus();
  return isLoading ? "Fetching client…" : "Documentation";
}
const render = () => act(async () => root.render(<SWRConfig value={swrConfig}><React.StrictMode><TestPage /></React.StrictMode></SWRConfig>));

test("selects an existing client after the client list loads without resolving again", async () => {
  const entry = { clientId: "chosen", token: "existing" };
  useCredentialEntries.mockReturnValue({ applications: [], hasFetchedApplications: false });
  await render();
  expect(resolve).not.toHaveBeenCalled();
  expect(select).not.toHaveBeenCalled();
  expect(container.textContent).toBe("Fetching client…");
  useCredentialEntries.mockReturnValue({ applications: [entry], hasFetchedApplications: true });
  await render();
  expect(select).toHaveBeenCalledWith("existing", "test", "123", entry);
  expect(container.textContent).toBe("Documentation");
  expect(resolve).not.toHaveBeenCalled();
});
test("connects a new client once and removes connection parameters while preserving the anchor", async () => {
  resolve.mockResolvedValue({ safeEntry: { id: "client:chosen", clientId: "chosen", token: "resolved" } });
  await render();
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(persist).toHaveBeenCalledWith(expect.objectContaining({ clientId: "chosen", agency: "123", profile: "test" }), { select: true });
  expect(replace).toHaveBeenCalledWith("/documentation#section", undefined, { shallow: true, scroll: false });
});
test("keeps a client requiring a secret available in Clients and shows the normal page", async () => {
  const entry = { clientId: "chosen", requiresClientSecret: true };
  resolve.mockResolvedValue({ status: "CLIENT_SECRET_REQUIRED", safeEntry: entry });
  await render();
  expect(clear).toHaveBeenCalledTimes(1);
  expect(persist).toHaveBeenCalledWith(expect.objectContaining(entry), { select: false });
  expect(container.textContent).toBe("Documentation");
  expect(replace).toHaveBeenCalled();
});
test("handles a new client link after navigation and ignores the previous pending response", async () => {
  let finishFirst;
  resolve.mockImplementationOnce(() => new Promise((done) => { finishFirst = done; }));
  await render();
  expect(container.textContent).toBe("Fetching client…");
  const router = useRouter();
  useRouter.mockReturnValue({ ...router, asPath: "/documentation?clientId=next", query: { clientId: "next" } });
  window.history.replaceState({}, "", "/documentation?clientId=next#next-section");
  resolve.mockResolvedValue({ safeEntry: { clientId: "next", token: "next-token" } });
  await render();
  await act(async () => finishFirst({ safeEntry: { clientId: "chosen", token: "old-token" } }));
  expect(container.textContent).toBe("Documentation");
  expect(persist).toHaveBeenCalledTimes(1);
  expect(persist).toHaveBeenCalledWith(expect.objectContaining({ clientId: "next" }), { select: true });
  expect(replace).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledWith("/documentation#next-section", undefined, { shallow: true, scroll: false });
});
