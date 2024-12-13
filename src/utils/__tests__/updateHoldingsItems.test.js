import { checkUserRights } from "../holdings";

const defaultUser = {
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

describe("checkUserRights", () => {
  test("unauthenticated users should be rejected", () => {
    const user = {
      ...defaultUser,
    };

    const actual = checkUserRights(user);

    expect(actual).toEqual("...");
  });
});
