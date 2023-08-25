import fetch from "isomorphic-unfetch";
import _permissions from "../../../../src/permissions.json";
import config from "../../../../src/config.js";

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
  const url = config.datasources.vipcore.url;
  const version = process.env.VIPCORE_VERSION || "3";

  return await fetch(`${url}/opensearchprofile/${agency}/${version}`, {
    method: "GET",
  });
}

/**
 * Extract specific data from whitelist
 */
const selectConfigurations = (data) => {
  const permissions = data.gateway ? data.gateway : _permissions.default;

  return {
    displayName: data.displayName,
    logoColor: data.logoColor,
    clientId: data.app?.clientId,
    uniqueId: data.user?.uniqueId,
    permissions: data.agencyId && permissions,
    agency: data.agencyId,
    expires: data.expires,
  };
};

/**
 * remote smaug api call
 */
async function getConfiguration(token) {
  const url = config.datasources.smaug.url;
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

  let result = {};

  switch (smaug_response.status) {
    case 200:
      const smaug_data = await smaug_response.json();
      const configuration = selectConfigurations(smaug_data);

      // add to result
      result = { ...configuration };

      if (configuration.agency) {
        // Get Search Profiles from vipcore
        const vipcore_response = await getProfiles(configuration.agency);

        switch (vipcore_response.status) {
          case 200:
            const vipcore_data = await vipcore_response.json();
            const profiles = selectProfiles(vipcore_data);

            // add to result
            result = { ...result, profiles };
        }
      }

      return res.status(200).send(result);
    default:
      return res.status(400).send({});
  }
}
