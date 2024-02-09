/**
 * @file The userinfo datasource holds 'ALOT' of logic and original smaug and userinfo data manipulation.
 * This logic is tested in this file by importing the real userinfo load function
 */

import { load } from "../datasources/userinfo.datasource";

// smaug mocked datasource - only used in this userinfo load test
const SMAUG = (accessToken) => {
  return {
    AUTHENTICATED_TOKEN: {
      user: {
        agency: "710100",
      },
    },
    NEMLOGIN_AUTHENTICATED_TOKEN: {
      user: {
        agency: "",
      },
    },
    FFU_AUTHENTICATED_TOKEN: {
      user: {
        agency: "800010",
      },
    },
    DATASYNC_AUTHENTICATED_TOKEN: {
      user: {
        agency: "872960",
      },
    },
  }[accessToken];
};

// libraries mocked datasource - only used in this userinfo load test
const LIBRARY = (branchId) => {
  return {
    710100: {
      result: [{ agencyType: "FOLKEBIBLIOTEK" }],
    },
    800010: {
      result: [{ agencyType: "FORSKNINGSBIBLIOTEK" }],
    },
    872960: {
      result: [{ agencyType: "FORSKNINGSBIBLIOTEK" }],
    },
    190101: {
      result: [{ agencyType: "ANDRE" }],
    },
  }[branchId];
};

//  mocked datasources
const datasources = {
  getLoader: (name) => {
    return {
      smaug: { load: async ({ accessToken }) => SMAUG(accessToken) },
      library: { load: async ({ branchId }) => LIBRARY(branchId) },
    }[name];
  },
};

// default userinfo object
const DEFAULT_USERINFO = {
  attributes: {
    userId: "some-userId",
    blocked: false,
    idpUsed: "borchk",
    uniqueId: "some-uniqueId",
    agencies: [
      {
        agencyId: "710100",
        userId: "some-globalId",
        userIdType: "CPR",
      },
      {
        agencyId: "710100",
        userId: "some-localId",
        userIdType: "LOCAL",
      },
    ],
    municipality: "101",
    municipalityAgencyId: "710100",
  },
};

// userinfo load() function test

describe("userinfo", () => {
  /**
   * Normal folk library user, only agency/loggedInAgencyId from smaug should be added here
   */
  test("FOLK authenticated user, enriched with smaug loggedInAgencyId", async () => {
    const context = {
      ...datasources,
      fetch: () => ({
        body: {
          attributes: {
            ...DEFAULT_USERINFO.attributes,
          },
        },
      }),
    };

    const result = await load({ accessToken: "AUTHENTICATED_TOKEN" }, context);

    expect(result).toMatchSnapshot();
  });

  /**
   * Normal FFU library user, only agency/loggedInAgencyId from smaug should be added here
   * OBS! municipalityAgencyId is set to 800010 - this solves the problem for digital article service for KB
   */
  test("FFU authenticated user, enriched with smaug loggedInAgencyId", async () => {
    const context = {
      ...datasources,
      fetch: () => ({
        body: {
          attributes: {
            ...DEFAULT_USERINFO.attributes,
            uniqueId: null,
            municipalityAgencyId: null,
            municipality: null,
            agencies: [
              {
                agencyId: "800010",
                userId: "some-localId",
                userIdType: "LOCAL",
              },
            ],
          },
        },
      }),
    };

    const result = await load({ accessToken: "AUTHENTICATED_TOKEN" }, context);

    expect(result).toMatchSnapshot();
  });

  /**
   * Libraries which sync data to culr - should be treated equally with folk libraries
   */
  test("DataSynced library authenticated user, enriched with smaug loggedInAgencyId", async () => {
    const context = {
      ...datasources,
      fetch: () => ({
        body: {
          attributes: {
            ...DEFAULT_USERINFO.attributes,
            uniqueId: null,
            municipalityAgencyId: null,
            municipality: null,
            agencies: [
              {
                agencyId: "872960",
                userId: "some-localId",
                userIdType: "LOCAL",
              },
            ],
          },
        },
      }),
    };

    const result = await load(
      { accessToken: "DATASYNC_AUTHENTICATED_TOKEN" },
      context
    );

    expect(result).toMatchSnapshot();
  });

  /**
   * Nemlogin validated user, with no agencies connected - returns a 190101 profile from CULR
   * OBS! LoggedInAgencyId is also set to 190101
   */
  test("Nemlogin authenticated user with NO agencies", async () => {
    const context = {
      ...datasources,
      fetch: () => ({
        body: {
          attributes: {
            ...DEFAULT_USERINFO.attributes,
            municipalityAgencyId: null,
            municipality: null,
            idpUsed: "nemlogin",
            agencies: [
              {
                agencyId: "190101",
                userId: "some-globalId",
                userIdType: "CPR",
              },
            ],
          },
        },
      }),
    };

    const result = await load(
      { accessToken: "NEMLOGIN_AUTHENTICATED_TOKEN" },
      context
    );

    expect(result).toMatchSnapshot();
  });

  /**
   * Folk authenticated user connected to a FFU library. All connected libraries should be returned
   */
  test("FOLK authenticated user connected to FFU library", async () => {
    const context = {
      ...datasources,
      fetch: () => ({
        body: {
          attributes: {
            ...DEFAULT_USERINFO.attributes,
            agencies: [
              {
                agencyId: "800010",
                userId: "some-localId",
                userIdType: "LOCAL",
              },
              ...DEFAULT_USERINFO.attributes.agencies,
            ],
          },
        },
      }),
    };

    const result = await load({ accessToken: "AUTHENTICATED_TOKEN" }, context);

    expect(result).toMatchSnapshot();
  });

  /**
   * FFU authenticated user connected to a Folk library. OBS! Only data from the FFU library should be returned here!
   * OBS! Also an omittedCulrData object should be added - This object should reflect all stripped culr data.
   * OBS!! municipalityAgencyId is set to 800010 - this solves the problem for digital article service for KB
   */
  test("FFU authenticated user connected to FOLK library", async () => {
    const context = {
      ...datasources,
      fetch: () => ({
        body: {
          attributes: {
            ...DEFAULT_USERINFO.attributes,
            agencies: [
              {
                agencyId: "800010",
                userId: "some-localId",
                userIdType: "LOCAL",
              },
              ...DEFAULT_USERINFO.attributes.agencies,
            ],
          },
        },
      }),
    };

    const result = await load(
      { accessToken: "FFU_AUTHENTICATED_TOKEN" },
      context
    );

    expect(result).toMatchSnapshot();
  });
});
