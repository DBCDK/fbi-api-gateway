const DEFAULT = {
  id: "XgY2QOGYqxGgHHYQu8DJKTKX2bbdMNBF",
  name: "Freja Damgaard",
  address: "Borgmesterskoven 45",
  postalCode: "8660",
  ddbcmsapi: "https://cmscontent.dbc.dk/",
  agency: "790900",
  mail: "test@dbc.dk",
};

const data = {
  DUMMY_TOKEN: {
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
