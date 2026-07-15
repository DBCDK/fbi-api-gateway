export async function load({ agencyId, bibliographicRecordId }) {
  if (agencyId === "715100" && bibliographicRecordId === "51068432") {
    return {
      status: "OK",
      ok: true,
      agencyId: 715100,
      bibliographicRecordId: 51068432,
      modified: "2024-01-04T12:45:01.333Z",
      firstAccessionDate: "2024-01-04",
      note: "Mock note",
      online: false,
      issues: {
        "issue-1": {
          issueText: "Issue text",
          expectedDelivery: "2024-02-01",
          readyForLoan: 1,
          items: {
            "item-1": {
              branch: "Hovedbiblioteket",
              branchId: 710100,
              department: "Voksen",
              location: "Lydboger",
              subLocation: "CD",
              section: "A",
              floatGroup: "grp-1",
              circulationRule: "Normal udlaan",
              accessionDate: "2024-01-04",
              loanRestriction: "f",
              status: "OnShelf",
              lastLoanDate: "2024-01-10",
              ownerAgencyId: 715100,
            },
          },
        },
      },
    };
  }

  if (agencyId === "877000" && bibliographicRecordId === "51701763") {
    return {
      status: "OK",
      ok: true,
      agencyId: 877000,
      bibliographicRecordId: 51701763,
      version: "2025-12-12T07:52:24.687Z",
      firstAccessionDate: "2015-06-02",
      note: "",
      online: false,
      issues: {
        "": {
          issueText: "",
          readyForLoan: 0,
          items: {
            5058092640: {
              branch: "Hasseris",
              branchId: 785107,
              department: "Børn",
              location: "Børn",
              subLocation: "",
              circulationRule: "Standard",
              accessionDate: "2015-06-02",
              loanRestriction: "",
              status: "OnLoan",
              ownerAgencyId: 785100,
              lastLoanDate: "2025-12-05",
            },
          },
        },
      },
    };
  }

  return {
    status: "ERROR",
    ok: false,
    message: "Record not found",
  };
}
