const data = {
  DUMMY_TOKEN: {
    id: "XgY2QOGYqxGgHHYQu8DJKTKX2bbdMNBF",
    name: "Freja Damgaard",
    address: "Borgmesterskoven 45",
    postalCode: "8660",
    loans: [
      {
        loanId: "120200589",
        dueDate: "2021-05-02T00:00:00+02:00",
        title: "Efter uvejret",
        creator: "Brooke, Lauren",
        materialId: "9788721016395",
        titleId: "23424916",
      },
      {
        loanId: "120200590",
        dueDate: "2021-04-30T00:00:00+02:00",
        title: "Vennebogen & Koglerier: to skuespil",
        creator: "Hultberg, Peer",
        materialId: "87-595-1659-3",
        titleId: "23518260",
      },
    ],
    ddbcmsapi: "https://cmscontent.dbc.dk/",
    agency: "790900",
  },
};

export async function load({ accessToken }) {
  return data[accessToken];
}
