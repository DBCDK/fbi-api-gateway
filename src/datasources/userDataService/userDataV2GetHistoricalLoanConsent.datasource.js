import config from "../../config";
import { getHistoricalLoanV2Response } from "./userDataHistoricalLoansV2.utils";

const { url, teamLabel } = config.datasources.userdata;

export async function load({ accessToken }, context) {
  const response = await context.fetch(`${url}v2/historical-loan/consent`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: "GET",
  });

  return getHistoricalLoanV2Response(response);
}

export { teamLabel };
