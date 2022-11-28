import request from "superagent";

/**
 * Fetch user info
 */
export async function load({ accessToken }) {
  const url = "https://login.bib.dk/userinfo";
  try {
    const res = (
      await request.get(url).set("Authorization", `Bearer ${accessToken}`)
    ).body;
    return res;
  } catch (e) {
    return null;
  }
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
