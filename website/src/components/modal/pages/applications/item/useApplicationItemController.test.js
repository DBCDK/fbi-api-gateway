jest.mock("@/hooks/legacy/useConfiguration", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialConfiguration", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialEntries", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialMutations", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialUser", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useInternalNetworkCheck", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/legacy/useUser", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/components/utils", () => ({
  dateConverter: jest.fn(() => "2026-06-04"),
  timeConverter: jest.fn(() => "10:00"),
}));

jest.mock("@/utils/configuration", () => ({
  hasAvailableAgency: jest.fn(() => true),
}));

const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");

const useConfiguration = require("@/hooks/legacy/useConfiguration").default;
const useCredentialConfiguration =
  require("@/hooks/credentials/useCredentialConfiguration").default;
const useCredentialEntries = require("@/hooks/credentials/useCredentialEntries").default;
const useCredentialMutations =
  require("@/hooks/credentials/useCredentialMutations").default;
const useCredentialUser = require("@/hooks/credentials/useCredentialUser").default;
const useInternalNetworkCheck =
  require("@/hooks/credentials/useInternalNetworkCheck").default;
const useUser = require("@/hooks/legacy/useUser").default;

const useApplicationItemController =
  require("./useApplicationItemController").default;

describe("useApplicationItemController session rehydration", () => {
  let container;
  let root;
  let controller;
  let resolveCredential;
  let setApplicationEntry;

  function Harness(props) {
    controller = useApplicationItemController(props);
    return null;
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    controller = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const modal = document.createElement("div");
    modal.id = "modal";
    document.body.appendChild(modal);

    resolveCredential = jest.fn().mockResolvedValue({
      safeEntry: {
        id: "client:2b25816b-6034-452d-9e10-b2e6c55f0f23",
        type: "client",
        clientId: "2b25816b-6034-452d-9e10-b2e6c55f0f23",
        token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
        profile: "bibdk21",
        agency: "190101",
      },
    });
    setApplicationEntry = jest.fn();

    useConfiguration.mockReturnValue({
      configuration: {},
      status: "OK",
      isLoading: false,
    });
    useCredentialConfiguration.mockReturnValue({
      configuration: {},
      status: "EXPIRED",
      isLoading: false,
      mutate: jest.fn(),
    });
    useCredentialEntries.mockReturnValue({
      setCredentialEntry: setApplicationEntry,
      removeCredentialEntry: jest.fn(),
    });
    useCredentialMutations.mockReturnValue({
      selectCredential: jest.fn(),
      clearSelectedCredential: jest.fn(),
      resolveCredentialValue: resolveCredential,
      attachCredentialSecret: jest.fn(),
    });
    useCredentialUser.mockReturnValue({
      user: {},
      mutate: jest.fn(),
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "enabled",
    });
    useUser.mockReturnValue({
      user: {},
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.getElementById("modal")?.remove();
  });

  test("recreates a missing server-side client entry from application backup data", async () => {
    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "client:2b25816b-6034-452d-9e10-b2e6c55f0f23",
          type: "client",
          clientId: "2b25816b-6034-452d-9e10-b2e6c55f0f23",
          token: "4ff4e4936471996cfb93091c9b93f5d4f71bff3f",
          timestamp: Date.now(),
          note: "saved note",
          agency: "190101",
          isVisible: true,
        })
      );
    });

    expect(resolveCredential).toHaveBeenCalledWith({
      value: "2b25816b-6034-452d-9e10-b2e6c55f0f23",
      entryId: "client:2b25816b-6034-452d-9e10-b2e6c55f0f23",
      agency: "190101",
    });
    expect(setApplicationEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "client:2b25816b-6034-452d-9e10-b2e6c55f0f23",
        clientId: "2b25816b-6034-452d-9e10-b2e6c55f0f23",
        note: "saved note",
      }),
      false
    );
    expect(controller.isLoadingView).toBe(false);
  });

  test("stops loading and persists an error state when session rehydration fails", async () => {
    resolveCredential.mockResolvedValue({
      status: "RESOLVE_FAILED",
      message: "Credential could not be resolved right now",
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "client:204936c7-d008-4d90-884b-0134a9918c3d",
          type: "client",
          clientId: "204936c7-d008-4d90-884b-0134a9918c3d",
          token: "f3e62557f4f6b383785825d3b85da3c814a189a1",
          timestamp: Date.now(),
          note: "",
          agency: "150015",
          isVisible: true,
        })
      );
    });

    expect(setApplicationEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "client:204936c7-d008-4d90-884b-0134a9918c3d",
        status: "ERROR",
        message: "Credential could not be resolved right now",
      }),
      false
    );
    expect(controller.isLoadingView).toBe(false);
  });

  test("does not rehydrate while a client item is still pending", async () => {
    useCredentialConfiguration.mockReturnValue({
      configuration: {},
      status: "EXPIRED",
      isLoading: false,
      mutate: jest.fn(),
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "client:2b25816b-6034-452d-9e10-b2e6c55f0f23",
          type: "client",
          clientId: "2b25816b-6034-452d-9e10-b2e6c55f0f23",
          token: null,
          timestamp: Date.now(),
          note: "",
          agency: "190101",
          isVisible: true,
          isPending: true,
        })
      );
    });

    expect(resolveCredential).not.toHaveBeenCalled();
    expect(controller.isLoadingView).toBe(true);
  });
});
