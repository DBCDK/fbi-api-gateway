import config from "../../config";
import { getHistoricalLoanV2Response } from "./userDataHistoricalLoansV2.utils";

const { url, teamLabel } = config.datasources.userdata;

export async function load({ accessToken, offset, limit }, context) {
  const query = new URLSearchParams();
  if (offset !== undefined) query.set("offset", offset);
  if (limit !== undefined) query.set("limit", limit);
  const queryString = query.toString();

  const response = await context.fetch(
    `${url}v2/historical-loan/get${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    }
  );

  return getHistoricalLoanV2Response(response);
}

export { teamLabel };
