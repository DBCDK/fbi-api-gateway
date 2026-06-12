const {
  getCanonicalId,
  getHistoryIdentifier,
  matchesSelectedCredentialIdentity,
  shouldClearSelectedTokenAfterRemoval,
} = require("../legacy/useStorage");

describe("getCanonicalId", () => {
  test("prefers an existing id when present", () => {
    expect(
      getCanonicalId({
        id: "client:already-there",
        type: "client",
        token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      })
    ).toBe("client:already-there");
  });

  test("derives a canonical client id when a client-backed entry has no id", () => {
    expect(
      getCanonicalId({
        id: null,
        type: "client",
        token: "51a33c6d19e0a22d32e93bf3cc2b0b6202399e7f",
        clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      })
    ).toBe("client:15804e47-4ffe-43a6-9adf-7176f0b5ba52");
  });

  test("returns null for empty or null entries", () => {
    expect(getCanonicalId(null)).toBeNull();
    expect(getCanonicalId(undefined)).toBeNull();
    expect(getCanonicalId({})).toBeNull();
  });
});

describe("getHistoryIdentifier", () => {
  test("returns null for empty or null entries", () => {
    expect(getHistoryIdentifier(null)).toBeNull();
    expect(getHistoryIdentifier(undefined)).toBeNull();
    expect(getHistoryIdentifier({})).toBeNull();
  });
});

describe("shouldClearSelectedTokenAfterRemoval", () => {
  test("clears the selected token when removing the active client entry", () => {
    const selectedToken = {
      id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      type: "client",
      clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      token: "bbbbbb6d19e0a22d32e93bf3cc2b0b6202399e7f",
    };

    const removedEntry = {
      id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      type: "client",
      clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      token: "aaaaaa6d19e0a22d32e93bf3cc2b0b6202399e7f",
    };

    expect(
      shouldClearSelectedTokenAfterRemoval(selectedToken, removedEntry, [])
    ).toBe(true);
  });

  test("keeps the selected token when removing a different application", () => {
    const selectedToken = {
      id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      type: "client",
      clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      token: "bbbbbb6d19e0a22d32e93bf3cc2b0b6202399e7f",
    };

    const removedEntry = {
      id: "client:204936c7-d008-4d90-884b-0134a9918c3d",
      type: "client",
      clientId: "204936c7-d008-4d90-884b-0134a9918c3d",
      token: "cccccc6d19e0a22d32e93bf3cc2b0b6202399e7f",
    };

    const remainingApplications = [selectedToken];

    expect(
      shouldClearSelectedTokenAfterRemoval(
        selectedToken,
        removedEntry,
        remainingApplications
      )
    ).toBe(false);
  });

  test("clears the selected token when applications sync returns no matching entry", () => {
    const selectedToken = {
      id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      type: "client",
      clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
      token: "bbbbbb6d19e0a22d32e93bf3cc2b0b6202399e7f",
    };

    expect(
      shouldClearSelectedTokenAfterRemoval(selectedToken, null, [])
    ).toBe(true);
  });
});

describe("matchesSelectedCredentialIdentity", () => {
  test("matches the same client application even when the token changes", () => {
    expect(
      matchesSelectedCredentialIdentity(
        {
          id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          type: "client",
          clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          token: "old-token-value",
        },
        "new-token-value",
        {
          id: "client:15804e47-4ffe-43a6-9adf-7176f0b5ba52",
          type: "client",
          clientId: "15804e47-4ffe-43a6-9adf-7176f0b5ba52",
        }
      )
    ).toBe(true);
  });
});
