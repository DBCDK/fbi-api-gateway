import config from "../../config";
import { getBookmarkV2Response } from "./userDataBookmarksV2.utils";

const { url, teamLabel } = config.datasources.userdata;

export async function load({ accessToken, bookmarks }, context) {
  const response = await context.fetch(`${url}v2/bookmark/add`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ bookmarks }),
  });

  return getBookmarkV2Response(response);
}

export { teamLabel };
