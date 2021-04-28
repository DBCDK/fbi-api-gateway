const data = {
  DUMMY_TOKEN: {
    id: "tZ7jUp8p/V5DOaVgquEUhq/f6DgzPDEe",
    name: "Anders Villadsen",
    address: "Palle Juul-Jensens Boulevard 115",
    postalCode: "8200",
    debt: [
      {
        amount: "224",
        currency: "DKK",
        date: "1970-01-01T00:00:00+01:00",
        title: "",
      },
      {
        amount: "50",
        currency: "DKK",
        date: "1970-01-01T00:00:00+01:00",
        title: "",
      },
    ],
    ddbcmsapi: "https://cmscontent.dbc.dk/",
    agency: "790900",
  },
};
export async function load({ accessToken }) {
  return data[accessToken];
}
