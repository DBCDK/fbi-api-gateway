import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

const query = `
  query($agencyId: String!, $bibliographicRecordId: String!) {
      holdingsItems {
        holdingsByBibliographicRecord(
          agencyId: $agencyId
          bibliographicRecordId: $bibliographicRecordId
        ) {
          ok
          status
          message
          holdings {
            agencyId
            bibliographicRecordId
          version
          firstAccessionDate
          note
          online
          issues {
            issueId
            issueText
            expectedDelivery
            readyForLoan
            items {
              itemId
              branch
              branchId
              department
              location
              subLocation
              section
              floatGroup
              circulationRule
              accessionDate
              loanRestriction
              status
              lastLoanDate
              ownerAgencyId
            }
          }
        }
      }
    }
  }
`;

test("retrieves holdingsItems data for a bibliographic record", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      agencyId: "715100",
      bibliographicRecordId: "51068432",
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        dbcidp: [{ productName: "HOLDINGSUPDATE", name: "WRITE" }],
      },
    },
  });

  expect(result?.data?.holdingsItems?.holdingsByBibliographicRecord).toEqual({
    ok: true,
    status: "OK",
    message: "ok",
    holdings: {
      agencyId: 715100,
      bibliographicRecordId: "51068432",
      version: "2024-01-04T12:45:01.333Z",
      firstAccessionDate: "2024-01-04",
      note: "Mock note",
      online: false,
      issues: [
        {
          issueId: "issue-1",
          issueText: "Issue text",
          expectedDelivery: "2024-02-01",
          readyForLoan: 1,
          items: [
            {
              itemId: "item-1",
              branch: "Hovedbiblioteket",
              branchId: 710100,
              department: "Voksen",
              location: "Lydboger",
              subLocation: "CD",
              section: "A",
              floatGroup: "grp-1",
              circulationRule: "Normal udlaan",
              accessionDate: "2024-01-04",
              loanRestriction: "F",
              status: "ONSHELF",
              lastLoanDate: "2024-01-10",
              ownerAgencyId: 715100,
            },
          ],
        },
      ],
    },
  });
});

test("returns error when user lacks holdingsItems permissions", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      agencyId: "715100",
      bibliographicRecordId: "51068432",
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        dbcidp: [],
      },
    },
  });

  expect(result?.data?.holdingsItems?.holdingsByBibliographicRecord).toEqual({
    ok: false,
    status: "ERROR_NO_AUTHORISATION",
    message: "Access denied: You do not have the required permissions.",
    holdings: null,
  });
});

test("returns error when holdingsItems service cannot find the record", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      agencyId: "715100",
      bibliographicRecordId: "does-not-exist",
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        dbcidp: [{ productName: "HOLDINGSUPDATE", name: "WRITE" }],
      },
    },
  });

  expect(result?.data?.holdingsItems?.holdingsByBibliographicRecord).toEqual({
    ok: false,
    status: "ERROR",
    message: "Record not found",
    holdings: null,
  });
});

test("preserves empty string values from holdingsItems service response", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      agencyId: "877000",
      bibliographicRecordId: "51701763",
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        dbcidp: [{ productName: "HOLDINGSUPDATE", name: "WRITE" }],
      },
    },
  });

  expect(result?.data?.holdingsItems?.holdingsByBibliographicRecord).toEqual({
    ok: true,
    status: "OK",
    message: "ok",
    holdings: {
      agencyId: 877000,
      bibliographicRecordId: "51701763",
      version: "2025-12-12T07:52:24.687Z",
      firstAccessionDate: "2015-06-02",
      note: "",
      online: false,
      issues: [
        {
          issueId: "",
          issueText: "",
          expectedDelivery: null,
          readyForLoan: 0,
          items: [
            {
              itemId: "5058092640",
              branch: "Hasseris",
              branchId: 785107,
              department: "Børn",
              location: "Børn",
              subLocation: "",
              section: null,
              floatGroup: null,
              circulationRule: "Standard",
              accessionDate: "2015-06-02",
              loanRestriction: null,
              status: "ONLOAN",
              lastLoanDate: "2025-12-05",
              ownerAgencyId: 785100,
            },
          ],
        },
      ],
    },
  });
});
