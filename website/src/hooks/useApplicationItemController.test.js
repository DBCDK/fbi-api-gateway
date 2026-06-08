jest.mock("@/hooks/useConfiguration", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useCredentialClientSecret", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useCredentialConfiguration", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useCredentialResolve", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useCredentialUser", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useInternalNetworkCheck", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useStorage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useUser", () => ({
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

const useConfiguration = require("@/hooks/useConfiguration").default;
const useCredentialClientSecret =
  require("@/hooks/useCredentialClientSecret").default;
const useCredentialConfiguration =
  require("@/hooks/useCredentialConfiguration").default;
const useCredentialResolve = require("@/hooks/useCredentialResolve").default;
const useCredentialUser = require("@/hooks/useCredentialUser").default;
const useInternalNetworkCheck =
  require("@/hooks/useInternalNetworkCheck").default;
const useStorage = require("@/hooks/useStorage").default;
const useUser = require("@/hooks/useUser").default;

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
    useCredentialClientSecret.mockReturnValue({
      attachClientSecret: jest.fn(),
    });
    useCredentialConfiguration.mockReturnValue({
      configuration: {},
      status: "EXPIRED",
      isLoading: false,
      mutate: jest.fn(),
    });
    useCredentialResolve.mockReturnValue({
      resolveCredential,
    });
    useCredentialUser.mockReturnValue({
      user: {},
      mutate: jest.fn(),
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "enabled",
    });
    useStorage.mockReturnValue({
      setSelectedToken: jest.fn(),
      removeSelectedToken: jest.fn(),
      setApplicationEntry,
      removeApplicationEntry: jest.fn(),
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
});
