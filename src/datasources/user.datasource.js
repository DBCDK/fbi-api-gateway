import config from "../config";

/**
 * Fetch user info
 */
export async function load({ accessToken }, context) {
  const url = config.datasources.openplatform.url + "/user";

  const res = await context?.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: accessToken,
      userinfo: ["userData"],
    }),
    allowedErrorStatusCodes: [403],
  });
  return res?.body?.data;
}
