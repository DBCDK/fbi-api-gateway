jest.mock("swr", () => ({
  useSWRConfig: jest.fn(),
}));

jest.mock("./useCredentialResolve", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("./useInternalNetworkCheck", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("./useCredentialClientSecret", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("./useCredentialRefreshToken", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("./useSelectedCredential", () => ({
  __esModule: true,
  default: jest.fn(),
  matchesSelectedCredentialIdentity: jest.fn(),
}));

jest.mock("./useCredentialEntries", () => ({
  __esModule: true,
  default: jest.fn(),
  getCredentialEntryId: jest.fn(({ id }) => id),
}));

const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const { useSWRConfig } = require("swr");
const useCredentialResolve = require("./useCredentialResolve").default;
const useInternalNetworkCheck = require("./useInternalNetworkCheck").default;
const useCredentialClientSecret =
  require("./useCredentialClientSecret").default;
const useCredentialRefreshToken =
  require("./useCredentialRefreshToken").default;
const useSelectedCredential = require("./useSelectedCredential").default;
const useCredentialEntries = require("./useCredentialEntries").default;
const useCredentialMutations = require("./useCredentialMutations").default;

describe("useCredentialMutations", () => {
  let container;
  let root;
  let hookValue;
  let mutate;
  let resolveCredential;
  let setCredentialEntry;

  function Harness() {
    hookValue = useCredentialMutations();
    return null;
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    hookValue = null;
    mutate = jest.fn(() => Promise.resolve());
    resolveCredential = jest.fn();
    setCredentialEntry = jest.fn((entry) => entry);

    useSWRConfig.mockReturnValue({ mutate });
    useCredentialResolve.mockReturnValue({ resolveCredential });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "enabled",
    });
    useCredentialClientSecret.mockReturnValue({
      attachClientSecret: jest.fn(),
      removeClientSecret: jest.fn(),
    });
    useCredentialRefreshToken.mockReturnValue({
      attachRefreshToken: jest.fn(),
    });
    useSelectedCredential.mockReturnValue({
      selectedCredential: null,
      setSelectedCredential: jest.fn(),
      clearSelectedCredential: jest.fn(),
    });
    useCredentialEntries.mockReturnValue({
      applications: [
        {
          id: "client:abc",
          type: "client",
          clientId: "abc",
          token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        },
      ],
      setCredentialEntry,
      removeCredentialEntry: jest.fn(),
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  test("revalidates credential views when replacing token for same client", async () => {
    resolveCredential.mockResolvedValue({
      safeEntry: {
        id: "client:abc",
        type: "client",
        clientId: "abc",
        token: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    });

    await act(async () => {
      root.render(React.createElement(Harness));
    });

    await act(async () => {
      await hookValue.resolveCredentialValue({ value: "abc" });
    });

    expect(setCredentialEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "client:abc",
        token: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      }),
      false
    );
    expect(mutate).toHaveBeenCalledTimes(2);

    expect(mutate).toHaveBeenCalledWith(
      "/api/credentials/configuration?entryId=client%3Aabc&networkCheck=enabled"
    );
    expect(mutate).toHaveBeenCalledWith(
      "/api/credentials/user?entryId=client%3Aabc"
    );
  });

});
