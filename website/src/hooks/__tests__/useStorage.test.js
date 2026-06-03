const { getCanonicalId } = require("../useStorage");

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
});
