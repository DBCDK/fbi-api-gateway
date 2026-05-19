export async function load({ agencyId, bibliographicRecordId }) {
  if (agencyId === "715100" && bibliographicRecordId === "51068432") {
    return {
      status: "OK",
      ok: true,
      agencyId: 715100,
      bibliographicRecordId: 51068432,
      version: "2024-01-04T12:45:01.333Z",
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

  return {
    status: "ERROR",
    ok: false,
    message: "Record not found",
  };
}
