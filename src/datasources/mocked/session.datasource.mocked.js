export async function load({ accessToken }) {
  const data = {
    "dummy-access-token": {
      userParameters: {
        cpr: "some-cpr",
        userId: "some-userid",
        barcode: "some-barcode",
        cardno: "some-cardno",
        customId: "some-customid",
        userDateOfBirth: "10-10-2021",
        userName: "Ost Ostesen",
        userAddress: "some-address",
        userMail: "some@mail.dk",
        userTelephone: "123123123",
      },
      pickupBranch: "790900",
    },
  };

  return data[accessToken];
}
