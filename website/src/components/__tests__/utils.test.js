const { isEqual } = require("../utils");

describe("isEqual", () => {
  test("keeps a credential in use when the token changes but client identity is the same", () => {
    expect(
      isEqual(
        {
          id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          token: "old-token-value",
          profile: "bibdk21",
          agency: "190101",
        },
        {
          id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          token: "new-token-value",
          profile: "bibdk21",
          agency: "190101",
        }
      )
    ).toBe(true);
  });
});
