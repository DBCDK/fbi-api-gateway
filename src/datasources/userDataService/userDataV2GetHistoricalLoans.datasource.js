import config from "../../config";
import { getHistoricalLoanV2Response } from "./userDataHistoricalLoansV2.utils";

const { url, teamLabel } = config.datasources.userdata;

export async function load({ accessToken, offset, limit }, context) {
  const response = await context.fetch(`${url}v2/historical-loan/get`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ offset, limit }),
  });

  return getHistoricalLoanV2Response(response);
}

export { teamLabel };
