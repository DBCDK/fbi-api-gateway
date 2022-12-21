import request from "superagent";

/**
 * Fetch user info
 */
export async function load({ accessToken }, context) {
  const url = "https://login.bib.dk/userinfo";
  const res = await context?.fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    allowedErrorStatusCodes: [401],
  });

  return res.body;
}

export const options = {
  redis: {
    prefix: "userinfo",
    ttl: 60 * 5,
  },
};
