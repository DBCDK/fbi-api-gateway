const data = {
  DUMMY_TOKEN: {
    id: "XgY2QOGYqxGgHHYQu8DJKTKX2bbdMNBF",
    name: "Freja Damgaard",
    address: "Borgmesterskoven 45",
    postalCode: "8660",
    ddbcmsapi: "https://cmscontent.dbc.dk/",
    agency: "790900",
    mail: "test@dbc.dk",
  },
};
export function load({ accessToken }) {
  return data[accessToken];
}
