import config from "../config";
import { load as getHistoricalLoans } from "../datasources/userDataService/userDataV2GetHistoricalLoans.datasource";
import { load as addHistoricalLoans } from "../datasources/userDataService/userDataV2AddHistoricalLoans.datasource";
import { load as deleteHistoricalLoans } from "../datasources/userDataService/userDataV2DeleteHistoricalLoans.datasource";
import { load as getHistoricalLoanConsent } from "../datasources/userDataService/userDataV2GetHistoricalLoanConsent.datasource";
import { load as setHistoricalLoanConsent } from "../datasources/userDataService/userDataV2SetHistoricalLoanConsent.datasource";

const accessToken = "forwarded-access-token";

function createContext(body) {
  return {
    fetch: jest.fn().mockResolvedValue({ ok: true, status: 200, body }),
  };
}

describe("UserData Historical Loan V2 datasources", () => {
  test("GET forwards the bearer token and pagination", async () => {
    const context = createContext({ hitcount: 0, status: "OK", items: [] });

    await expect(
      getHistoricalLoans({ accessToken, offset: 20, limit: 5 }, context)
    ).resolves.toEqual({ hitcount: 0, status: "OK", items: [] });
    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/historical-loan/get?offset=20&limit=5`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        method: "GET",
      }
    );
  });

  test("ADD forwards historical loans built by the Patron resolver", async () => {
    const context = createContext({ results: [] });
    const loans = [
      {
        agencyId: "710100",
        loanedAt: "2026-05-01",
        returnedAt: "2026-05-20",
        materialId: "23424916",
        materialIdType: "FAUST",
        snapshot: { title: "Efter uvejret" },
      },
    ];

    await addHistoricalLoans({ accessToken, loans }, context);
    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/historical-loan/add`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ loans }),
      }
    );
  });

  test("DELETE forwards public UserData UUIDs", async () => {
    const context = createContext({ results: [] });
    const ids = ["45fb4d52-d7f7-4c36-a94f-37a00eb60163"];

    await deleteHistoricalLoans({ accessToken, ids }, context);
    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/historical-loan/delete`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }
    );
  });

  test("GET consent forwards the bearer token", async () => {
    const context = createContext({ consent: true });

    await expect(
      getHistoricalLoanConsent({ accessToken }, context)
    ).resolves.toEqual({ consent: true });
    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/historical-loan/consent`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        method: "GET",
      }
    );
  });

  test("PUT consent forwards the bearer token and consent", async () => {
    const context = createContext({ consent: false });

    await expect(
      setHistoricalLoanConsent({ accessToken, consent: false }, context)
    ).resolves.toEqual({ consent: false });
    expect(context.fetch).toHaveBeenCalledWith(
      `${config.datasources.userdata.url}v2/historical-loan/consent`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "PUT",
        body: JSON.stringify({ consent: false }),
      }
    );
  });

  test("preserves stable UserData service error codes", async () => {
    const context = {
      fetch: jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        body: {
          error: {
            code: "HISTORICAL_LOAN_MANUAL_ADDS_DISABLED",
            message: "Manual historical-loan adds are disabled",
          },
        },
      }),
    };

    const request = addHistoricalLoans({ accessToken, loans: [] }, context);
    await expect(request).rejects.toMatchObject({
      status: 403,
      serviceErrorCode: "HISTORICAL_LOAN_MANUAL_ADDS_DISABLED",
    });
    await expect(request).rejects.not.toThrow(accessToken);
  });
});
