import config from "../../config";
import { getBookmarkV2Response } from "./userDataBookmarksV2.utils";

const { url, teamLabel } = config.datasources.userdata;

export async function load({ accessToken, bookmarkIds }, context) {
  const response = await context.fetch(`${url}v2/bookmark/delete`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({ bookmarkIds }),
  });

  return getBookmarkV2Response(response);
}

export { teamLabel };
