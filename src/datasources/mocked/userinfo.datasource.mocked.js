const DEFAULT = {
  uniqueId: "some-unique-id",
  municipalityAgencyId: "715100",
  agencies: [
    {
      agencyId: "715100",
      userId: "some@mail.com",
      userIdType: "LOCAL",
    },
  ],
};

const data = {
  ANONYMOUS_TOKEN: {},
  DUMMY_TOKEN: {
    attributes: {
      ...DEFAULT,
    },
  },
  DUMMY_TOKEN_USER_BLOCKED: {
    attributes: {
      ...DEFAULT,
      agencies: [
        {
          agencyId: "715100",
          userId: "0123456799",
          userIdType: "LOCAL",
        },
      ],
    },
  },
  DUMMY_TOKEN_NO_MAIL: {
    attributes: {
      ...DEFAULT,
    },
  },
  DUMMY_TOKEN_USER_NOT_ON_PICKUPAGENCY: {
    attributes: {
      ...DEFAULT,
      agencies: [
        {
          agencyId: "710100",
          userId: "321",
          userIdType: "LOCAL",
        },
      ],
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
