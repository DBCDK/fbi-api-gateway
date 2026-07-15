const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");

const {
  SELECTED_CREDENTIAL_CLEARED_EVENT,
} = require("../useSelectedCredential");
const useCredentialInputFlow =
  require("../useCredentialInputFlow").default;

describe("useCredentialInputFlow", () => {
  let container;
  let root;
  let hookValue;
  let originalFetch;

  function Harness(props) {
    hookValue = useCredentialInputFlow(props);
    return null;
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    hookValue = null;
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    global.fetch = originalFetch;
  });

  test("does not reselect a cleared credential from a stale clientId input value", async () => {
    const onChange = jest.fn();
    const selectCredential = jest.fn();
    const baseProps = {
      applications: [
        {
          id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          type: "client",
          clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
          hasClientSecret: true,
          profile: "bibdk21",
          agency: "190101",
        },
      ],
      hasFetchedApplications: true,
      setCredentialEntry: jest.fn(),
      resolveCredentialValue: jest.fn(),
      attachCredentialSecret: jest.fn(),
      selectCredential,
      clearSelectedCredential: jest.fn(),
      onSubmit: jest.fn(),
      onChange,
      blurInput: jest.fn(),
      focusInput: jest.fn(),
    };

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          ...baseProps,
          selectedCredential: {
            token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
            clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          },
        })
      );
    });

    expect(hookValue.credentialValue).toBe("");

    await act(async () => {
      hookValue.setCredentialValue("15804e47-4ffe-43a6-9adf-7176f0b5ba52");
    });

    expect(hookValue.credentialValue).toBe("15804e47-4ffe-43a6-9adf-7176f0b5ba52");
    await act(async () => {});
    selectCredential.mockClear();
    onChange.mockClear();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(SELECTED_CREDENTIAL_CLEARED_EVENT, {
          detail: {
            token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
            clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          },
        })
      );
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          ...baseProps,
          selectedCredential: null,
        })
      );
    });

    expect(hookValue.credentialValue).toBe("");
    expect(onChange).toHaveBeenCalledWith("");
    expect(selectCredential).not.toHaveBeenCalled();
  });

  test("reuses an existing token for the same clientId even without a stored client secret", async () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn();
    const selectCredential = jest.fn();
    const setCredentialEntry = jest.fn();
    const resolveCredentialValue = jest.fn();
    const blurInput = jest.fn();

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          applications: [
            {
              id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
              type: "client",
              clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
              token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
              hasClientSecret: false,
              profile: "bibdk21",
              agency: "190101",
            },
          ],
          hasFetchedApplications: true,
          selectedCredential: null,
          setCredentialEntry,
          resolveCredentialValue,
          attachCredentialSecret: jest.fn(),
          selectCredential,
          clearSelectedCredential: jest.fn(),
          onSubmit,
          onChange,
          blurInput,
          focusInput: jest.fn(),
        })
      );
    });

    await act(async () => {
      await hookValue.handleResolveCredential(
        "15804e47-4ffe-43a6-9adf-7176f0b5ba52"
      );
    });

    expect(resolveCredentialValue).not.toHaveBeenCalled();
    expect(setCredentialEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
      }),
      false
    );
    expect(selectCredential).toHaveBeenCalledWith(
      "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
      "bibdk21",
      "190101",
      expect.objectContaining({
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        hasClientSecret: false,
      }),
      { reorderApplications: false }
    );
    expect(onSubmit).toHaveBeenCalledWith(
      "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f"
    );
    expect(onChange).toHaveBeenCalledWith(
      "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f"
    );
  });

  test("prewarms configuration for a newly resolved client before submit", async () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn();
    const selectCredential = jest.fn();
    const setCredentialEntry = jest.fn();
    const resolveCredentialValue = jest.fn().mockResolvedValue({
      safeEntry: {
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        type: "client",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
        hasClientSecret: false,
        agency: "190101",
        status: "OK",
      },
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        agency: "190101",
        profiles: ["bibdk21"],
        permissions: {
          allowRootFields: ["search"],
        },
      }),
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          applications: [],
          hasFetchedApplications: true,
          selectedCredential: null,
          setCredentialEntry,
          resolveCredentialValue,
          attachCredentialSecret: jest.fn(),
          selectCredential,
          clearSelectedCredential: jest.fn(),
          onSubmit,
          onChange,
          blurInput: jest.fn(),
          focusInput: jest.fn(),
        })
      );
    });

    await act(async () => {
      await hookValue.handleResolveCredential(
        "15804e47-4ffe-43a6-9adf-7176f0b5ba52"
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/credentials/configuration?entryId=client%3A15804e47-4ffe-43a6-9adf-7176f0b5ba52&agency=190101",
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(setCredentialEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        configuration: expect.objectContaining({
          agency: "190101",
          permissions: expect.objectContaining({
            allowRootFields: ["search"],
          }),
        }),
        profile: "bibdk21",
      }),
      false
    );
    expect(onSubmit).toHaveBeenCalledWith(
      "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f"
    );
  });

  test("does not reselect a newly added client when enrichment finishes after another client was chosen", async () => {
    jest.useFakeTimers();
    let resolveCredentialResponse;
    const newClientId = "15804e47-4ffe-43a6-9adf-7176f0b5ba53";
    const onChange = jest.fn();
    const onSubmit = jest.fn();
    const selectCredential = jest.fn();
    const setCredentialEntry = jest.fn();
    const resolveCredentialValue = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCredentialResponse = resolve;
        })
    );

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        agency: "190101",
        profiles: ["bibdk21"],
        permissions: {
          allowRootFields: ["search"],
        },
      }),
    });

    const props = {
      applications: [],
      hasFetchedApplications: true,
      selectedCredential: null,
      setCredentialEntry,
      resolveCredentialValue,
      attachCredentialSecret: jest.fn(),
      selectCredential,
      clearSelectedCredential: jest.fn(),
      onSubmit,
      onChange,
      blurInput: jest.fn(),
      focusInput: jest.fn(),
    };

    await act(async () => {
      root.render(React.createElement(Harness, props));
    });

    let resolutionPromise;
    await act(async () => {
      resolutionPromise = hookValue.handleResolveCredential(newClientId);
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          ...props,
          selectedCredential: {
            id: "client:other-client",
            type: "client",
            clientId: "other-client",
            token: "other-client-token",
          },
        })
      );
    });

    await act(async () => {
      resolveCredentialResponse({
        safeEntry: {
          id: `client:${newClientId}`,
          type: "client",
          clientId: newClientId,
          token: "new-client-token",
          hasClientSecret: false,
          agency: "190101",
          status: "OK",
        },
      });
      jest.advanceTimersByTime(1200);
      await resolutionPromise;
    });

    jest.useRealTimers();

    expect(setCredentialEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: `client:${newClientId}`,
        configuration: expect.objectContaining({
          permissions: expect.objectContaining({
            allowRootFields: ["search"],
          }),
        }),
      }),
      false
    );
    expect(selectCredential).not.toHaveBeenCalledWith(
      "new-client-token",
      "bibdk21",
      "190101",
      expect.any(Object),
      { reorderApplications: false }
    );
    expect(onSubmit).toHaveBeenCalledWith("new-client-token");
  });

  test("syncs the input value when another selected client takes over", async () => {
    const selectCredential = jest.fn();
    const resolveCredentialValue = jest.fn();

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          applications: [
            {
              id: "client:first-client",
              type: "client",
              clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
              token: "first-token",
              hasClientSecret: false,
              profile: "bibdk21",
              agency: "190101",
            },
            {
              id: "client:second-client",
              type: "client",
              clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba53",
              token: "second-token",
              hasClientSecret: false,
              profile: "bibdk22",
              agency: "190102",
            },
          ],
          hasFetchedApplications: true,
          selectedCredential: {
            id: "client:first-client",
            type: "client",
            clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
            token: "first-token",
          },
          setCredentialEntry: jest.fn(),
          resolveCredentialValue,
          attachCredentialSecret: jest.fn(),
          selectCredential,
          clearSelectedCredential: jest.fn(),
          onSubmit: jest.fn(),
          onChange: jest.fn(),
          blurInput: jest.fn(),
          focusInput: jest.fn(),
        })
      );
    });

    expect(hookValue.credentialValue).toBe("");

    await act(async () => {
      hookValue.setCredentialValue("15804e47-4ffe-43a6-9adf-7176f0b5ba52");
    });

    await act(async () => {
      root.render(
        React.createElement(Harness, {
          applications: [
            {
              id: "client:first-client",
              type: "client",
              clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
              token: "first-token",
              hasClientSecret: false,
              profile: "bibdk21",
              agency: "190101",
            },
            {
              id: "client:second-client",
              type: "client",
              clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba53",
              token: "second-token",
              hasClientSecret: false,
              profile: "bibdk22",
              agency: "190102",
            },
          ],
          hasFetchedApplications: true,
          selectedCredential: {
            id: "client:second-client",
            type: "client",
            clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba53",
            token: "second-token",
          },
          setCredentialEntry: jest.fn(),
          resolveCredentialValue,
          attachCredentialSecret: jest.fn(),
          selectCredential,
          clearSelectedCredential: jest.fn(),
          onSubmit: jest.fn(),
          onChange: jest.fn(),
          blurInput: jest.fn(),
          focusInput: jest.fn(),
        })
      );
    });

    expect(hookValue.credentialValue).toBe(
      "15804e47-4ffe-43a6-9adf-7176f0b5ba53"
    );
    expect(resolveCredentialValue).not.toHaveBeenCalled();
  });
});
