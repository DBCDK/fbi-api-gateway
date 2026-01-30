/**
 * @file
 * Tests the checkUserRights access rights function for the update holdingsItems service
 */

import { checkUserRights } from "../holdings";

describe("checkUserRights", () => {
  test("users with no loggedInAgencyId should be rejected", () => {
    const user = {
      serviceStatus: {
        borchk: "ok",
        culr: "ok",
      },
      userId: "some-userId",
      idpUsed: "nemlogin",
      agencies: [
        {
          agencyId: "790900",
          userId: "some-userId",
          userIdType: "LOCAL",
        },
      ],
      loggedInBranchId: null,
      loggedInAgencyId: null,
    };

    const actual = checkUserRights(user);

    expect(actual).toEqual({
      ok: false,
      status: "ERROR_INVALID_AGENCY",
      message:
        "Invalid token: Missing agencyId. Ensure your login method provides an agencyId.",
    });
  });

  test("users missing idp access rights should be rejected", () => {
    const user = {
      serviceStatus: {
        borchk: "ok",
        culr: "ok",
      },
      userId: "some-userId",
      idpUsed: "netpunkt",
      agencies: [
        {
          agencyId: "790900",
          userId: "some-userId",
          userIdType: "LOCAL",
        },
      ],
      netpunktAgency: "790900",
      dbcidp: [
        {
          agencyId: "790900",
          rights: [],
        },
      ],
      loggedInBranchId: "790900",
      loggedInAgencyId: "790900",
    };

    const actual = checkUserRights(user);

    expect(actual).toEqual({
      ok: false,
      status: "ERROR_NO_AUTHORISATION",
      message: "Access denied: You do not have the required permissions.",
    });
  });

  test("Authenticated users with agencyId and idp rights should get access", () => {
    const user = {
      serviceStatus: {
        borchk: "ok",
        culr: "ok",
      },
      userId: "some-userId",
      idpUsed: "netpunkt",
      agencies: [
        {
          agencyId: "790900",
          userId: "some-userId",
          userIdType: "LOCAL",
        },
      ],
      netpunktAgency: "790900",
      dbcidp: [
        {
          agencyId: "790900",
          rights: [
            {
              productName: "VIP",
              name: "libraryrules view",
              description:
                "is allowed to view everything on the library rules page",
            },
            {
              productName: "HOLDINGSUPDATE",
              name: "WRITE",
              description: "Is allowed to write to Holdingsupdate",
            },
            {
              productName: "VIP",
              name: "change library",
              description:
                "is allowed to edit data for all libraries view, allowed to view specific pages",
            },
            {
              productName: "HOLDINGSUPDATE",
              name: "READ",
              description: "Is allowed to read from Holdingsupdate",
            },
          ],
        },
      ],
      loggedInBranchId: "790900",
      loggedInAgencyId: "790900",
    };

    const actual = checkUserRights(user);

    expect(actual).toEqual({ ok: true });
  });

  test("Idp system user (anonymous) with agencyId and idp rights should get access", () => {
    const user = {
      serviceStatus: {
        borchk: "ok",
        culr: "ok",
      },
      userId: "@",
      idpUsed: "netpunkt",
      agencies: null,
      netpunktAgency: "790900",
      dbcidp: [
        {
          agencyId: "790900",
          rights: [
            {
              productName: "VIP",
              name: "libraryrules view",
              description:
                "is allowed to view everything on the library rules page",
            },
            {
              productName: "HOLDINGSUPDATE",
              name: "WRITE",
              description: "Is allowed to write to Holdingsupdate",
            },
            {
              productName: "VIP",
              name: "change library",
              description:
                "is allowed to edit data for all libraries view, allowed to view specific pages",
            },
            {
              productName: "HOLDINGSUPDATE",
              name: "READ",
              description: "Is allowed to read from Holdingsupdate",
            },
          ],
        },
      ],
      loggedInBranchId: "790900",
      loggedInAgencyId: "790900",
    };

    const actual = checkUserRights(user);

    expect(actual).toEqual({ ok: true });
  });
});
