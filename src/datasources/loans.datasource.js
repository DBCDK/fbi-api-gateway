import config from "../config";
/**
 * Fetch user info
 */
export async function load({ accessToken }, context) {
  const url = config.datasources.openplatform.url + "/user";

  return (
    await context.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: accessToken,
        userinfo: ["userLoan"],
      }),
    })
  ).body?.data;
}
