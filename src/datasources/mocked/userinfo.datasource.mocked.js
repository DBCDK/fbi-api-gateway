const data = {
  DUMMY_TOKEN: {
    attributes: {
      uniqueId: "some-unique-id",
      agencies: [
        {
          agencyId: "190110",
          userId: "some@mail.com",
          userIdType: "LOCAL",
        },
      ],
    },
  },
};
export function load({ accessToken }) {
  return data[accessToken];
}
