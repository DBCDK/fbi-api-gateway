import fetch from "isomorphic-unfetch";
import permissions from "../../../../src/permissions.json";

/**
 * Extract specific data from whitelist
 */
const selectData = (data) => {
  return {
    displayName: data.displayName,
    logoColor: data.logoColor,
    clientId: data.app?.clientId,
    uniqueId: data.user?.uniqueId,
    permissions: data.gateway ? data.gateway : permissions.default,
  };
};

/**
 * remote smaug api call
 */
async function getConfiguration(token) {
  const url = process.env.SMAUG_URL || "https://auth-config.dbc.dk";
  return await fetch(`${url}/configuration?token=${token}`, {
    method: "GET",
  });
}

/**
 * Handle smaug endpoint req and res
 */
export default async function handler(req, res) {
  const token = req.query.token;

  if (!token) {
    // Missing token -> throw bad request
    return res.status(400).send({});
  }

  const response = await getConfiguration(token);

  switch (response.status) {
    case 200:
      const data = await response.json();
      const selected = selectData(data);
      return res.status(200).send(selected);
    default:
      return res.status(400).send({});
  }
}
