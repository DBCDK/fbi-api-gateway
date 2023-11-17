import fetch from "isomorphic-unfetch";
import config from "../../../../src/config.js";

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

    // add to result
    user.loggedInAgencyId = smaug_data?.user?.agency || null;

    const userinfo_response = await getUserinfo(token);

    if (userinfo_response.status === 200) {
      const userinfo_data = (await userinfo_response.json()).attributes;

      //   user = { ...user, ...userinfo_data?.attributes };

      user.userId = userinfo_data.userId;
      user.identityProviderUsed = userinfo_data.idpUsed;
      user.hasCulrUniqueId = !!userinfo_data.uniqueId;
      user.isAuthenticated = !!userinfo_data.userId;
      user.municipalityAgencyId = userinfo_data.municipalityAgencyId;
      user.agencies = userinfo_data.agencies.map(({ agencyId }) => agencyId);

      user.isCPRValidated = !!userinfo_data.agencies.find(
        (a) => a.userIdType === "CPR"
      );

      const userstatus_response = await getOpenUserStatus(user);

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
