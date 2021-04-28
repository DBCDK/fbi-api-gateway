const data = {
  DUMMY_TOKEN: {
    id: "XgY2QOGYqxGgHHYQu8DJKTKX2bbdMNBF",
    name: "Freja Damgaard",
    address: "Borgmesterskoven 45",
    postalCode: "8660",
    orders: [
      {
        orderId: "12341234",
        orderType: "normal",
        status: "At reservation shelf",
        pickUpAgency: "DK-715100",
        creator: "Loe, Erlend",
        title: "Enden på verden som vi kender den: roman",
        orderDate: "2021-04-21T13:37:49+02:00",
        pickUpExpiryDate: "2021-05-03T00:00:00+02:00",
        titleId: "52186986",
      },
    ],
    ddbcmsapi: "https://cmscontent.dbc.dk/",
    agency: "790900",
  },
};

export async function load({ accessToken }) {
  return data[accessToken];
}
