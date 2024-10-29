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
    AUTHENTICATED_BRANCH_TOKEN: {
      user: {
        agency: "737001", // <-- branch
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
    // Nordjyske Gymnasiebiblioteker (Selvstændigt opfattende bibliotek på branchId fremfor agencyId)
    FFU_BRANCH_INDEPENDENT_TOKEN: {
      user: {
        agency: "872100",
      },
    },
    // Token for connected user (FFU & Folk) which has loggedIn by an FFU branch
    FFU_BRANCH_AUTHENTICATED_TOKEN: {
      user: {
        agency: "800021",
      },
    },
  }[accessToken];
};

// libraries mocked datasource - only used in this userinfo load test
const LIBRARY = (branchId) => {
  return {
    710100: {
      result: [{ agencyType: "FOLKEBIBLIOTEK", agencyId: "710100" }],
    },
    737001: {
      result: [{ agencyType: "FOLKEBIBLIOTEK", agencyId: "737000" }],
    },
    800010: {
      result: [{ agencyType: "FORSKNINGSBIBLIOTEK", agencyId: "800010" }],
    },
    872960: {
      result: [{ agencyType: "FORSKNINGSBIBLIOTEK", agencyId: "872960" }],
    },
    190101: {
      result: [{ agencyType: "ANDRE", agencyId: "190101" }],
    },
    872100: {
      result: [{ agencyType: "FORSKNINGSBIBLIOTEK", agencyId: "876040" }],
    },
    800021: {
      result: [{ agencyType: "FORSKNINGSBIBLIOTEK", agencyId: "800010" }],
    },
  }[branchId];
};

const VIP = () => {
  return {
    737000: { loginAgencyId: "737000" },
    872100: { loginAgencyId: "872100" },
    800010: { loginAgencyId: "800010" },
  };
};

const CULR = (agencyId) => {
  return {
    800010: {
      omittedCulrData: {
        hasOmittedCulrUniqueId: true,
        hasOmittedCulrMunicipality: true,
        hasOmittedCulrMunicipalityAgencyId: true,
        hasOmittedCulrAccounts: true,
      },
    },
  }[agencyId];
};

//  mocked datasources
const datasources = {
  getLoader: (name) => {
    return {
      smaug: { load: async ({ accessToken }) => SMAUG(accessToken) },
      library: { load: async ({ branchId }) => LIBRARY(branchId) },
      culrGetAccountsByLocalId: {
        load: async ({ agencyId }) => CULR(agencyId),
      },
      vipcore_BorrowerCheckList: {
        load: async () => VIP(),
      },
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
   * Normal folk library user, only agency/loggedInAgencyId AND agency/loggedInBranchId from smaug should be added here
   * Agency was used for login. LoggedInAgencyId and loggedInBranchId should NOT differ.
   */
  test("FOLK authenticated user, enriched with smaug agency", async () => {
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
   * Normal folk library user, only agency/loggedInAgencyId AND agency/loggedInBranchId from smaug should be added here
   * Branch was used for login. LoggedInAgencyId and loggedInBranchId SHOULD differ.
   */
  test("FOLK (branch) authenticated user, enriched with smaug agency", async () => {
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

    const result = await load(
      { accessToken: "AUTHENTICATED_BRANCH_TOKEN" },
      context
    );

    expect(result).toMatchSnapshot();
  });

  /**
   * Normal FFU library user, only agency/loggedInAgencyId AND agency/loggedInBranchId from smaug should be added here
   * OBS! municipalityAgencyId is set to 800010 - this solves the problem for digital article service for KB
   * FFU Users with no uniqueId should NOT recieve the omittedCulrData object.
   */
  test("FFU authenticated user, enriched with smaug agency", async () => {
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
   * FFU Users with no uniqueId should NOT recieve the omittedCulrData object.
   */
  test("DataSynced library authenticated user, enriched with smaug agency", async () => {
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
  test("FFU authenticated user connected to FOLK library (Agency login)", async () => {
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

  /**
   * FFU authenticated user connected to a Folk library. OBS! Only data from the FFU library should be returned here!
   * OBS! Also an omittedCulrData object should be added - This object should reflect all stripped culr data.
   * OBS!! municipalityAgencyId is set to 800010 - this solves the problem for digital article service for KB
   *
   * For the FFU BRANCH login, /userinfo will not retrieve the user's connected CULR accounts (only agencyId exist in CULR).
   * Therefore, we perform this check ourselves to ensure that the omittedDataObject matches the actual user data
   */
  test.only("FFU authenticated user connected to FOLK library (Branch login)", async () => {
    const context = {
      ...datasources,
      fetch: () => ({
        body: {
          attributes: {
            ...DEFAULT_USERINFO.attributes,
            uniqueId: null,
            municipality: null,
            municipalityAgencyId: null,
            agencies: [
              {
                agencyId: "800021",
                userId: "some-localId",
                userIdType: "LOCAL",
              },
            ],
          },
        },
      }),
    };

    const result = await load(
      { accessToken: "FFU_BRANCH_AUTHENTICATED_TOKEN" },
      context
    );

    expect(result).toMatchSnapshot();
  });

  /**
   * FFU authenticated user for "Nordjyske Gymnasiebiblioteker", agency/loggedInAgencyId AND agency/loggedInBranchId from smaug should be added here.
   * loggedInAgencyId AND loggedInBranchId should NOT differ (branch was selected for login).
   * Users with no uniqueId should not recieve the omittedCulrData object.
   * Should NOT get the culrOmittedData prop
   */
  test("FFU authenticated user for independent library enriched with agency/loggedInBranchId", async () => {
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
                agencyId: "872100",
                userId: "some-localId",
                userIdType: "LOCAL",
              },
            ],
          },
        },
      }),
    };

    const result = await load(
      { accessToken: "FFU_BRANCH_INDEPENDENT_TOKEN" },
      context
    );

    expect(result).toMatchSnapshot();
  });

  /**
   * FFU authenticated user for "Nordjyske Gymnasiebiblioteker", agency/loggedInAgencyId AND agency/loggedInBranchId from smaug should be added here.
   * loggedInAgencyId AND loggedInBranchId should NOT differ (branch was selected for login).
   * Should get the culrOmittedData prop
   */
  test("FFU authenticated user for independent library should find hidden account", async () => {
    const context = {
      ...datasources,
      fetch: () => ({
        body: {
          attributes: {
            ...DEFAULT_USERINFO.attributes,
            agencies: [
              {
                agencyId: "872100",
                userId: "some-localId",
                userIdType: "LOCAL",
              },
            ],
          },
        },
      }),
    };

    const result = await load(
      { accessToken: "FFU_BRANCH_INDEPENDENT_TOKEN" },
      context
    );

    expect(result).toMatchSnapshot();
  });
});
