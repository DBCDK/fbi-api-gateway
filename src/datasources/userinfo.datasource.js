import request from "superagent";

/**
 * Fetch user info
 */
export async function load({ accessToken }) {
  const url = "https://login.bib.dk/userinfo";
  const res = (
    await request.get(url).set("Authorization", `Bearer ${accessToken}`)
  ).body;
  return res;
}
