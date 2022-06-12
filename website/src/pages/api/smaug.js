import fetch from "isomorphic-unfetch";
import permissions from "../../../../src/permissions.json";

/**
 * Extract specific data from whitelist
 */
const selectProfiles = (data) => {
  return data?.profile?.map((p) => p.profileName);
};

/**
 * remote smaug api call
 */
async function getProfiles(agency) {
  const url =
    process.env.VIPCORE_URL ||
    "http://vipcore.iscrum-vip-prod.svc.cloud.dbc.dk/1.0";
  const version = process.env.VIPCORE_VERSION || "3";

  return await fetch(`${url}/api/opensearchprofile/${agency}/${version}`, {
    method: "GET",
  });
}

/**
 * Extract specific data from whitelist
 */
const selectConfigurations = (data) => {
  return {
    displayName: data.displayName,
    logoColor: data.logoColor,
    clientId: data.app?.clientId,
    uniqueId: data.user?.uniqueId,
    permissions: data.gateway ? data.gateway : permissions.default,
    agency: data.agencyId,
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

  const smaug_response = await getConfiguration(token);

  switch (smaug_response.status) {
    case 200:
      const smaug_data = await smaug_response.json();
      const configuration = selectConfigurations(smaug_data);

      if (configuration.agency) {
        // Get Search Profiles from vipcore
        const vipcore_response = await getProfiles(configuration.agency);

        switch (vipcore_response.status) {
          case 200:
            const vipcore_data = await vipcore_response.json();
            const profiles = selectProfiles(vipcore_data);
            return res.status(200).send({ ...configuration, profiles });
        }
      }

      return res.status(200).send(configuration);
    default:
      return res.status(400).send({});
  }
}
