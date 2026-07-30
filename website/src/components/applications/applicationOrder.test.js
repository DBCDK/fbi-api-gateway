import { reorderSelectedApplication } from "./applicationOrder";

describe("reorderSelectedApplication", () => {
  test("moves the selected application after the modal has exited", () => {
    const selectedCredential = {
      id: "client:example",
      clientId: "example",
      token: "0123456789012345678901234567890123456789",
    };
    const setCredentialEntry = jest.fn();

    expect(
      reorderSelectedApplication(selectedCredential, setCredentialEntry)
    ).toBe(true);
    expect(setCredentialEntry).toHaveBeenCalledWith(
      selectedCredential,
      false
    );
  });

  test("does nothing when no credential is selected", () => {
    const setCredentialEntry = jest.fn();

    expect(reorderSelectedApplication(null, setCredentialEntry)).toBe(false);
    expect(setCredentialEntry).not.toHaveBeenCalled();
  });
});
