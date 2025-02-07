const DEFAULT = {
  id: "x",
  name: "Freja Damgaard",
  address: "Borgmesterskoven 45",
  postalCode: "8660",
  ddbcmsapi: "https://cmscontent.dbc.dk/",
  agency: "790900",
  mail: "test@dbc.dk",
  country: "DK",
};

export function load({ userId, agencyId }) {
  if (userId === "some-id-without-mail" && agencyId === "715100") {
    return { ...DEFAULT, mail: undefined };
  }

  // User insufficient data from OpenUserStatus Service
  if (userId === "some-insufficient-userstatus-id-1") {
    return {
      ...DEFAULT,
      mail: undefined,
      address: undefined,
      postalCode: undefined,
      country: undefined,
    };
  }
  if (userId === "some-insufficient-userstatus-id-2") {
    return {
      ...DEFAULT,
      name: "should NOT be visible",
      mail: undefined,
    };
  }
  if (userId === "some-insufficient-userstatus-id-3") {
    return {
      ...DEFAULT,
      name: "should NOT be visible",
      address: "should NOT be visible",
      postalCode: "should NOT be visible",
      country: "should NOT be visible",
    };
  }
  //

  return DEFAULT;
}

export { teamLabel };
