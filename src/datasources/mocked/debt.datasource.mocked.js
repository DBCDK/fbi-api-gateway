const data = {
  DUMMY_TOKEN: {
    result: [
      {
        title: "",
        amount: "224",
        creator: null,
        date: "1969-12-31T23:00:00.000Z",
        currency: "DKK",
        agencyId: "790900",
      },
      {
        title: "",
        amount: "50",
        creator: null,
        date: "1969-12-31T23:00:00.000Z",
        currency: "DKK",
        agencyId: "790900",
      },
    ],
  },
};

export async function load({ accessToken }) {
  return data[accessToken];
}
