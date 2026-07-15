jest.mock("@/hooks/useConfiguration", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialEntries", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialInputFlow", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialMutations", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useCredentialNetwork", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useInternalNetworkCheck", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/credentials/useSelectedCredential", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");

const useConfiguration = require("@/hooks/useConfiguration").default;
const useCredentialEntries = require("@/hooks/credentials/useCredentialEntries").default;
const useCredentialInputFlow =
  require("@/hooks/credentials/useCredentialInputFlow").default;
const useCredentialMutations =
  require("@/hooks/credentials/useCredentialMutations").default;
const useCredentialNetwork = require("@/hooks/credentials/useCredentialNetwork").default;
const useInternalNetworkCheck =
  require("@/hooks/credentials/useInternalNetworkCheck").default;
const useSelectedCredential = require("@/hooks/credentials/useSelectedCredential").default;

const useConnectController = require("../useConnectController").default;

describe("useConnectController", () => {
  let container;
  let root;
  let controller;
  let handleResolveCredential;
  let handleAttachSecret;
  let resetCredentialInput;
  let inputRef;
  let selectedCredential;

  function Harness(props) {
    controller = useConnectController(props);
    return null;
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    controller = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    inputRef = {
      current: {
        focus: jest.fn(),
        blur: jest.fn(),
      },
    };
    handleResolveCredential = jest.fn();
    handleAttachSecret = jest.fn();
    resetCredentialInput = jest.fn();

    selectedCredential = {
      token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
      clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      hasClientSecret: true,
      profile: "bibdk21",
    };
    useSelectedCredential.mockImplementation(() => ({
      selectedCredential,
    }));
    useCredentialEntries.mockImplementation(() => ({
      applications: selectedCredential ? [selectedCredential] : [],
      hasFetchedApplications: true,
      setCredentialEntry: jest.fn(),
      getCredentialEntry: jest.fn((tokenOrEntry) => {
        if (!selectedCredential) {
          return null;
        }

        if (typeof tokenOrEntry === "string") {
          return selectedCredential.token === tokenOrEntry ||
            selectedCredential.clientId === tokenOrEntry ||
            selectedCredential.id === tokenOrEntry
            ? selectedCredential
            : null;
        }

        return tokenOrEntry?.token === selectedCredential.token ||
          tokenOrEntry?.clientId === selectedCredential.clientId ||
          tokenOrEntry?.id === selectedCredential.id
          ? selectedCredential
          : null;
      }),
    }));
    useCredentialMutations.mockReturnValue({
      clearSelectedCredential: jest.fn(),
      resolveCredentialValue: jest.fn(),
      attachCredentialSecret: jest.fn(),
      selectCredential: jest.fn(),
    });
    useCredentialNetwork.mockReturnValue({
      isInternal: false,
      isLoading: false,
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "disabled",
    });
    useConfiguration.mockReturnValue({
      configuration: {
        displayName: "DBC Client",
        resolvedHasClientSecret: true,
      },
      status: "OK",
      isLoading: false,
    });
    useCredentialInputFlow.mockReturnValue({
      inputRef,
      credentialValue: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      setCredentialValue: jest.fn(),
      secretValue: "",
      setSecretValue: jest.fn(),
      pendingClient: null,
      resolveError: "",
      setResolveError: jest.fn(),
      resolvingCredential: null,
      handleResolveCredential,
      handleAttachSecret,
      resetCredentialInput,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("submits the selected token directly when the credential is already resolved", async () => {
    const onSubmit = jest.fn();

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit,
          onChange: jest.fn(),
        })
      );
    });

    await act(async () => {
      await controller.handleFormSubmit({ preventDefault: jest.fn() });
    });

    expect(onSubmit).toHaveBeenCalledWith(
      "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f"
    );
    expect(handleResolveCredential).not.toHaveBeenCalled();
    expect(inputRef.current.blur).toHaveBeenCalled();
  });

  test("marks the form valid when a pending client has a secret value", async () => {
    const onValidityChange = jest.fn();

    useCredentialInputFlow.mockReturnValue({
      inputRef,
      credentialValue: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      setCredentialValue: jest.fn(),
      secretValue: "super-secret",
      setSecretValue: jest.fn(),
      pendingClient: {
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      },
      resolveError: "",
      setResolveError: jest.fn(),
      resolvingCredential: null,
      handleResolveCredential,
      handleAttachSecret,
      resetCredentialInput,
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
          onValidityChange,
        })
      );
    });

    expect(onValidityChange).toHaveBeenCalledWith(true);
  });

  test("marks the form valid when a pending client becomes internal", async () => {
    const onValidityChange = jest.fn();

    useCredentialNetwork.mockReturnValue({
      isInternal: true,
      isLoading: false,
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "enabled",
    });
    useCredentialInputFlow.mockReturnValue({
      inputRef,
      credentialValue: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      setCredentialValue: jest.fn(),
      secretValue: "",
      setSecretValue: jest.fn(),
      pendingClient: {
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      },
      resolveError: "",
      setResolveError: jest.fn(),
      resolvingCredential: null,
      handleResolveCredential,
      handleAttachSecret,
      resetCredentialInput,
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
          onValidityChange,
        })
      );
    });

    expect(onValidityChange).toHaveBeenCalledWith(true);
    expect(controller.pendingClient).toBe(null);
  });

  test("hides client-secret steps on an active internal network", async () => {
    useCredentialNetwork.mockReturnValue({
      isInternal: true,
      isLoading: false,
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "enabled",
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    expect(controller.showSteps).toBe(false);
  });

  test("keeps steps hidden for an already selected credential on external network", async () => {
    selectedCredential = {
      token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
      clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      hasClientSecret: false,
      profile: "bibdk21",
    };
    useConfiguration.mockReturnValue({
      configuration: {
        displayName: "DBC Client",
        resolvedHasClientSecret: false,
      },
      status: "OK",
      isLoading: false,
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    expect(controller.hasResolvedDisplay).toBe(true);
    expect(controller.hasResolvedClientSecret).toBe(false);
    expect(controller.showSteps).toBe(false);
  });

  test("re-resolves a pending client when switching from external to internal network", async () => {
    useCredentialInputFlow.mockReturnValue({
      inputRef,
      credentialValue: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      setCredentialValue: jest.fn(),
      secretValue: "",
      setSecretValue: jest.fn(),
      pendingClient: {
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      },
      resolveError: "",
      setResolveError: jest.fn(),
      resolvingCredential: null,
      handleResolveCredential,
      handleAttachSecret,
      resetCredentialInput,
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    useCredentialNetwork.mockReturnValue({
      isInternal: true,
      isLoading: false,
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "enabled",
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    expect(handleResolveCredential).toHaveBeenCalledWith(
      "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      expect.objectContaining({
        shouldSubmit: false,
        onResolvedSelection: expect.any(Function),
      })
    );
  });

  test("re-resolves a selected internal client when switching to external network", async () => {
    useCredentialNetwork.mockReturnValue({
      isInternal: true,
      isLoading: false,
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "enabled",
    });
    selectedCredential = {
      token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
      clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      hasClientSecret: false,
      profile: "bibdk21",
    };

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    useCredentialNetwork.mockReturnValue({
      isInternal: false,
      isLoading: false,
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "disabled",
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    expect(handleResolveCredential).toHaveBeenCalledWith(
      "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      expect.objectContaining({
        shouldSubmit: false,
        onResolvedSelection: expect.any(Function),
      })
    );
  });

  test("submits a pending client by re-resolving instead of requiring a secret on internal network", async () => {
    const onSubmit = jest.fn();

    useCredentialNetwork.mockReturnValue({
      isInternal: true,
      isLoading: false,
    });
    useInternalNetworkCheck.mockReturnValue({
      internalNetworkCheck: "enabled",
    });
    useCredentialInputFlow.mockReturnValue({
      inputRef,
      credentialValue: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      setCredentialValue: jest.fn(),
      secretValue: "",
      setSecretValue: jest.fn(),
      pendingClient: {
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      },
      resolveError: "",
      setResolveError: jest.fn(),
      resolvingCredential: null,
      handleResolveCredential,
      handleAttachSecret,
      resetCredentialInput,
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit,
          onChange: jest.fn(),
        })
      );
    });

    await act(async () => {
      await controller.handleFormSubmit({ preventDefault: jest.fn() });
    });

    expect(handleResolveCredential).toHaveBeenCalledWith(
      "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      expect.objectContaining({
        shouldSubmit: true,
      })
    );
    expect(handleAttachSecret).not.toHaveBeenCalled();
  });

  test("clears focus state while a credential is resolving", async () => {
    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    act(() => {
      controller.handleFormFocusCapture();
    });

    expect(controller.hasFocus).toBe(true);

    useCredentialInputFlow.mockReturnValue({
      inputRef,
      credentialValue: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      setCredentialValue: jest.fn(),
      secretValue: "",
      setSecretValue: jest.fn(),
      pendingClient: null,
      resolveError: "",
      setResolveError: jest.fn(),
      resolvingCredential: {
        type: "client",
        value: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      },
      handleResolveCredential,
      handleAttachSecret,
      resetCredentialInput,
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    expect(controller.hasFocus).toBe(false);
  });

  test("keeps the pasted token visible until token resolving finishes", async () => {
    selectedCredential = {
      token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
      clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      hasClientSecret: false,
      profile: "bibdk21",
    };
    useCredentialInputFlow.mockReturnValue({
      inputRef,
      credentialValue: "raw-token-value-that-user-pasted",
      setCredentialValue: jest.fn(),
      secretValue: "",
      setSecretValue: jest.fn(),
      pendingClient: null,
      resolveError: "",
      setResolveError: jest.fn(),
      resolvingCredential: {
        type: "token",
        value: "raw-token-value-that-user-pasted",
      },
      handleResolveCredential,
      handleAttachSecret,
      resetCredentialInput,
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          id: "connect",
          onSubmit: jest.fn(),
          onChange: jest.fn(),
        })
      );
    });

    expect(controller.credentialValue).toBe("raw-token-value-that-user-pasted");
  });
});
