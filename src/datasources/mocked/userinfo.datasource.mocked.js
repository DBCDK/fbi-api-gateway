const DEFAULT = {
  uniqueId: "some-unique-id",
  municipalityAgencyId: "715100",
  agencies: [
    {
      agencyId: "190110",
      userId: "some@mail.com",
      userIdType: "LOCAL",
    },
  ],
};

const data = {
  DUMMY_TOKEN: {
    attributes: {
      ...DEFAULT,
    },
  },
  DUMMY_TOKEN_NO_MAIL: {
    attributes: {
      ...DEFAULT,
    },
  },
  DUMMY_TOKEN_UNSUBSCRIPED_MUNICIPALITY: {
    attributes: {
      ...DEFAULT,
      municipalityAgencyId: "100200",
    },
  },
};

export function load({ accessToken }) {
  return data[accessToken];
}
