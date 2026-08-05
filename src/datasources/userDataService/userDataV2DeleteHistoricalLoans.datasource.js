import config from "../../config";
import { getHistoricalLoanV2Response } from "./userDataHistoricalLoansV2.utils";

const { url, teamLabel } = config.datasources.userdata;

export async function load({ accessToken, ids }, context) {
  const response = await context.fetch(`${url}v2/historical-loan/delete`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });

  return getHistoricalLoanV2Response(response);
}

export { teamLabel };
