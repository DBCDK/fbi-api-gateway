import config from "../../config";
import { getBookmarkV2Response } from "./userDataBookmarksV2.utils";

const { url, teamLabel } = config.datasources.userdata;

export async function load(
  { accessToken, filterApplications, orderBy, offset, limit },
  context
) {
  const query = new URLSearchParams();
  filterApplications?.forEach((application) =>
    query.append("filterApplications", application)
  );
  if (orderBy) query.set("orderBy", orderBy);
  if (offset !== undefined) query.set("offset", offset);
  if (limit !== undefined) query.set("limit", limit);
  const queryString = query.toString();

  const response = await context.fetch(
    `${url}v2/bookmark/get${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    }
  );

  return getBookmarkV2Response(response);
}

export { teamLabel };
