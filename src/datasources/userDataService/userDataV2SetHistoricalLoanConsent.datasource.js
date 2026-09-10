import config from "../../config";
import { getHistoricalLoanV2Response } from "./userDataHistoricalLoansV2.utils";

const { url, teamLabel } = config.datasources.userdata;

export async function load({ accessToken, consent }, context) {
  const response = await context.fetch(`${url}v2/historical-loan/consent`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify({ consent }),
  });

  return getHistoricalLoanV2Response(response);
}

export { teamLabel };
