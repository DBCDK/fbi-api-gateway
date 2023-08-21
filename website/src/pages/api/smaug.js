import fetch from "isomorphic-unfetch";
import _permissions from "../../../../src/permissions.json";
import config from "../../../../src/config.js";
import {
  reduceBody,
  constructSoap,
} from "../../../../src/datasources/user.datasource";

/**
 * Extract specific data
 */
const selectUserdata = (data) => {
  /**
   * data contains:
   *
   *  id
   *  name,
   *  address,
   *  postalCode,
   *  mail,
   *  loans,
   *  orders,
   *  debt,
   *  ddbcmsapi
   *  agency
   */

  return { name: data.name, mail: data.mail };
};

/**
 * remote userstatus api call
 */
// async function getUserdata(token) {
//   const url = config.datasources.smaug.url;
//   return await fetch(`${url}/configuration?token=${token}`);
// }

async function getUserData() {
  const { municipalityAgencyId, agencies } = userinfo;

  let userId = agencies?.find(
    (a) => a.agencyId === municipalityAgencyId && a.userIdType === "LOCAL"
  );
  if (!userId) {
    userId = agencies?.find(
      (a) => a.agencyId === municipalityAgencyId && a.userIdType === "CPR"
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: constructSoap({
      agencyId: municipalityAgencyId,
      userId,
    }),
  });

  return reduceBody(res?.body);
}

/**
 * Extract specific data from whitelist
 */
const selectUserinfo = (data) => {
  console.log("selectUserInfo data", data);

  return {
    blocked: data.attributes.blocked,
    agencies: data.attributes.agencies,
    municipalityAgencyId: data.attributes.municipalityAgencyId,
  };
};

/**
 * remote smaug api call
 */
async function getUserinfo(token) {
  const url = config.datasources.userInfo.url;
  return await fetch(`${url}/`, {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
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
          // return res.status(200).send({ ...configuration, profiles });
        }
      }

      if (configuration.uniqueId) {
        // Get userinfo from login.bib.dk/userinfo
        const userinfo_response = await getUserinfo(token);

        switch (userinfo_response.status) {
          case 200:
            const userinfo_data = await userinfo_response.json();
            const userinfo = selectUserinfo(userinfo_data);

            // add to result
            result = { ...result, user: userinfo };

            const userdata_response = getUserData(userinfo);

            switch (userdata_response.status) {
              case 200:
                const user_data = await userdata_response.json();
                const userdata = selectUserdata(user_data.data);

                // add to result
                result.user = { ...result.user, ...userdata };
            }
        }
      }

      return res.status(200).send(result);

    default:
      return res.status(400).send({});
  }
}
