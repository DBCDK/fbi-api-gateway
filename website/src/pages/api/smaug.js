import fetch from "isomorphic-unfetch";
import _permissions from "../../../../src/permissions";
import config from "../../../../src/config.js";
import { parseClientPermissions } from "../../../../commonUtils";

/**
 * remote smaug api call
 */
async function getUserinfo(token) {
  const url = config.datasources.userInfo.url;

  return await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

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
  const permissions = parseClientPermissions({ smaug: data });

  return {
    displayName: data.displayName,
    logoColor: data.logoColor,
    clientId: data.app?.clientId,
    userId: data.user?.id,
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
    case 200: {
      const smaug_data = await smaug_response.json();
      const configuration = selectConfigurations(smaug_data);

      // add to result
      result = { ...configuration };

      if (configuration.userId) {
        // If token is authenticated, ensure userinfo returns 200
        // if NOT, token is from a different environment stg/prod
        const userinfo_response = await getUserinfo(token);
        if (userinfo_response.status !== 200) {
          return res.status(401).send({});
        }
      }

      if (configuration.agency) {
        // Get Search Profiles from vipcore
        const vipcore_response = await getProfiles(configuration.agency);

        if (vipcore_response.status === 200) {
          const vipcore_data = await vipcore_response.json();
          const profiles = selectProfiles(vipcore_data);

          // add to result
          result = { ...result, profiles };
        } else {
          // No profiles found for agencyId
          result = {
            ...result,
            profiles: ["none"],
          };
        }
      }

      return res.status(200).send(result);
    }
    default:
      return res.status(smaug_response.status).send({});
  }
}
