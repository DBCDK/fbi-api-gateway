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

const data = {
  DUMMY_TOKEN: {
    ...DEFAULT,
  },
  DUMMY_TOKEN_USER_BLOCKED: {
    ...DEFAULT,
  },
  DUMMY_TOKEN_UNSUBSCRIPED_MUNICIPALITY: {
    ...DEFAULT,
  },
  DUMMY_TOKEN_NO_MAIL: {
    ...DEFAULT,
    mail: undefined,
  },
};
export function load({ accessToken }) {
  return data[accessToken];
}
