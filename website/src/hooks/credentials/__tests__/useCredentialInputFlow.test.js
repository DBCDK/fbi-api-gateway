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

  function Harness(props) {
    hookValue = useCredentialInputFlow(props);
    return null;
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    hookValue = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
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
});
