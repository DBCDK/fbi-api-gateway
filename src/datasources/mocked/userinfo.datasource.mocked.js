const DEFAULT = {
  userId: "some-id",
  uniqueId: "some-unique-id",
  municipalityAgencyId: "715100",
  loggedInAgencyId: "715100",
  agencies: [
    {
      agencyId: "715100",
      userId: "some@mail.com",
      userIdType: "LOCAL",
    },
  ],
};

const DEFAULT_FFU = {
  userId: "some-id",
  uniqueId: null,
  municipalityAgencyId: null,
  loggedInAgencyId: "800010",
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
  DUMMY_TOKEN_BLOCKED: {
    attributes: {
      ...DEFAULT,
      userId: "some-blocked-id",
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
          userId: "some-random-id",
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
  DUMMY_TOKEN_NO_ACCOUNTS: {
    attributes: {
      ...DEFAULT,
      userId: "some-id",
      agencies: [],
    },
  },

  // CULR test tokens (FFU)

  FFU_AUTHENTICATED_TOKEN: {
    attributes: {
      ...DEFAULT_FFU,
      userId: "C000000002",
      loggedInAgencyId: "800010",
    },
  },
  AUTHENTICATED_TOKEN_USER2: {
    attributes: {
      ...DEFAULT,
      userId: "0102033692",
      loggedInAgencyId: "790900",
      agencies: [
        {
          userIdValue: "0102033692",
          userIdType: "CPR",
          agencyId: "790900",
        },
      ],
    },
  },
  AUTHENTICATED_TOKEN_USER1: {
    attributes: {
      ...DEFAULT,
      userId: "0102033690",
      loggedInAgencyId: "790900",
      agencies: [
        {
          userIdValue: "0102033690",
          userIdType: "CPR",
          agencyId: "790900",
        },
      ],
    },
  },
};

export function load({ accessToken }) {
  return data[accessToken];
}
