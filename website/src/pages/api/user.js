import fetch from "isomorphic-unfetch";
import config from "../../../../src/config";

import { setMunicipalityAgencyId } from "../../../../src/utils/municipalityAgencyId";
import { omitUserinfoCulrData } from "../../../../src/utils/omitCulrData";
import { _isFFUAgency } from "../../../../src/utils/agency";
import { search } from "../../../../src/datasources/library.datasource";
import replaceBranchIdWithAgencyId from "../../../../src/utils/replaceBranchIdWithAgencyId";

const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
} = config.datasources.openorder;

const constructSoap = ({ agencyId, userId }) => {
  let soap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:open="http://oss.dbc.dk/ns/openuserstatus">
  <soapenv:Header/>
  <soapenv:Body>
    <open:getUserStatusRequest>
      <open:agencyId>${agencyId}</open:agencyId>
      <open:authentication>
        <open:groupIdAut>${authenticationGroup}</open:groupIdAut>
        <open:passwordAut>${authenticationPassword}</open:passwordAut>
        <open:userIdAut>${authenticationUser}</open:userIdAut>
      </open:authentication>
      <open:outputType>json</open:outputType>
      <open:userId>${userId}</open:userId>
      <open:selectUserInfo>userData</open:selectUserInfo>
    </open:getUserStatusRequest>
  </soapenv:Body>
</soapenv:Envelope>
`;

  return soap;
};

const reduceBody = (body) => ({
  name: body?.getUserStatusResponse?.userName?.$,
  mail: body?.getUserStatusResponse?.userMail?.$,
  //   address: body?.getUserStatusResponse?.userAddress?.$,
  //   postalCode: body?.getUserStatusResponse?.userPostalCode?.$,
  //   country: body?.getUserStatusResponse?.userCountry?.$,
});

export async function getOpenUserStatus({ loggedInAgencyId, userId }) {
  const { url } = config.datasources.openuserstatus;

  const soap = constructSoap({
    agencyId: loggedInAgencyId,
    userId,
  });

  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: soap,
  });
}

/**
 * Fetch user info
 */
export async function getUserinfo(token) {
  const url = config.datasources.userInfo.url;

  return await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * remote smaug api call
 */
async function getConfiguration(token) {
  const url = config.datasources.smaug.url;
  return await fetch(`${url}/configuration?token=${token}`, {
    method: "GET",
  });
}

export default async function handler(req, res) {
  const token = req.query.token;

  if (!token) {
    // Missing token -> throw bad request
    return res.status(400).send({});
  }

  const smaug_response = await getConfiguration(token);

  let user = {};

  if (smaug_response.status === 200) {
    const smaug_data = await smaug_response.json();

    const isFFULogin = _isFFUAgency(smaug_data?.user?.agency);

    // add to result
    user.loggedInAgencyId = smaug_data?.user?.agency || null;

    const userinfo_response = await getUserinfo(token);

    if (userinfo_response.status === 200) {
      const userinfo_data = (await userinfo_response.json()).attributes;

      const idpUsed = userinfo_data?.idpUsed;

      user.loggedInAgencyId =
        idpUsed === "nemlogin" && !smaug_data?.user?.agency
          ? "190101"
          : smaug_data?.user?.agency || null;

      let attributes = {
        ...userinfo_data,
        loggedInAgencyId: user.loggedInAgencyId,
        // loggedInBranchId: null,
      };

      // *** DISABLED FOR NOW ***
      // For FFU libraries the /userinfo and smaug fields can now hold both an agencyIds and branchIds
      // Therefore all used fields which contains branchIds will be replaced with an agencyId
      if (false && isFFULogin) {
        attributes = await replaceBranchIdWithAgencyId(attributes, {
          getLoader: () => ({
            load: async (attr) => await search(attr),
          }),
        });

        // update branch- and loggedInAgencyId
        user.loggedInAgencyId = attributes?.loggedInAgencyId;
        user.loggedInBranchId = attributes?.loggedInBranchId;
      }

      // This check prevents FFU users from accessing CULR data.
      // FFU Borchk authentication, is not safe enough to expose CULR data.
      if (isFFULogin) {
        attributes = omitUserinfoCulrData(attributes);
      }

      user.omittedCulrData = attributes.omittedCulrData;

      const hasCPRValidatedAccount = !!attributes.agencies.find(
        (a) => a.userIdType === "CPR"
      );

      // unique agencyId list
      const agencies = [];
      attributes.agencies.forEach(
        ({ agencyId }) =>
          !agencies.includes(agencyId) && agencies.push(agencyId)
      );

      user.userId = attributes.userId;
      user.identityProviderUsed = attributes.idpUsed;
      user.hasCulrUniqueId = !!attributes.uniqueId && !isFFULogin;
      user.isAuthenticated = !!attributes.userId && attributes.userId !== "@";

      // Fixes that folk bib users with associated FFU Accounts overrides users municipalityAgencyId with FFU agencyId
      user.municipalityAgencyId = await setMunicipalityAgencyId(attributes);

      user.agencies = agencies.length > 0 ? agencies : [];
      user.isCPRValidated =
        attributes.idpUsed === "nemlogin" || hasCPRValidatedAccount;

      // userinfo account select (CPR prioritized)
      const account = attributes.agencies.find((a) => a.userIdType === "CPR");

      const userstatus_response = await getOpenUserStatus({
        loggedInAgencyId: account?.agencyId || user?.loggedInAgencyId,
        userId: account?.userId || user?.userId,
      });

      if (userstatus_response.status === 200) {
        const userstatus_data = reduceBody(await userstatus_response.json());

        user.name = userstatus_data.name;
        user.mail = userstatus_data.mail;
      }
    }

    return res.status(200).send({ user });
  }

  return res.status(404).send({});
}
