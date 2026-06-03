/**
 * @file API route for returning user/introspection data for either a raw token
 * or a server-side credential session entry with token lifecycle support.
 */
import fetch from "isomorphic-unfetch";

import config from "../../../../../src/config";
import {
  setMunicipalityAgencyId,
} from "../../../../../src/utils/municipalityAgencyId";
import { omitUserinfoCulrData } from "../../../../../src/utils/omitCulrData";
import { search } from "../../../../../src/datasources/library.datasource";
import { load as getAccountsByLocalId } from "../../../../../src/datasources/culrGetAccountsByLocalId.datasource";
import {
  _isFFUAgency,
  _hasCulrDataSync,
  getAgencyIdByBranchId,
} from "../../../../../src/utils/agency";

import { resolveCredentialAccessToken } from "../../../lib/credentialAccess";
import {
  getSmaugConfiguration,
  getUserinfo,
} from "../../../lib/credentialProviders";
import { getCredentialSessionEntry } from "../../../lib/credentialSession";

const { authenticationUser, authenticationGroup, authenticationPassword } =
  config.datasources.openorder;

const constructSoap = ({ agencyId, userId }) => `
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

const reduceBody = (body) => ({
  name: body?.getUserStatusResponse?.userName?.$,
  mail: body?.getUserStatusResponse?.userMail?.$,
});

async function getOpenUserStatus({ loggedInAgencyId, userId }) {
  const { url } = config.datasources.openuserstatus;

  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: constructSoap({ agencyId: loggedInAgencyId, userId }),
  });
}

async function resolveAccessToken(req) {
  const token = typeof req.query.token === "string" ? req.query.token : null;

  if (token) {
    return { token, status: 200 };
  }

  const entryId =
    typeof req.query.entryId === "string" ? req.query.entryId : null;

  if (!entryId) {
    return { status: 400 };
  }

  const sessionEntry = await getCredentialSessionEntry({ req }, entryId);

  if (!sessionEntry) {
    return { status: 404 };
  }

  return await resolveCredentialAccessToken({
    ctx: { req, res: req.res },
    entryId,
    entry: sessionEntry,
    req,
  });
}

export default async function handler(req, res) {
  const resolved = await resolveAccessToken(req);

  if (resolved.status === 428) {
    return res.status(428).send({
      status: "CLIENT_SECRET_REQUIRED",
      user: {},
    });
  }

  if (resolved.status !== 200 || !resolved.token) {
    return res.status(resolved.status || 500).send({});
  }

  const smaugResponse = await getSmaugConfiguration(resolved.token);

  if (smaugResponse.status !== 200) {
    return res.status(404).send({});
  }

  const smaugData = await smaugResponse.json();
  const isFFULogin =
    _isFFUAgency(smaugData?.user?.agency) &&
    !_hasCulrDataSync(smaugData?.user?.agency);

  const user = {
    loggedInAgencyId: smaugData?.user?.agency || null,
  };

  const userinfoResponse = await getUserinfo(resolved.token);

  if (userinfoResponse.status !== 200) {
    return res.status(200).send({ user });
  }

  const userinfoData = (await userinfoResponse.json()).attributes;
  const idpUsed = userinfoData?.idpUsed;

  user.loggedInBranchId =
    idpUsed === "nemlogin" && !smaugData?.user?.agency
      ? "190101"
      : smaugData?.user?.agency || null;

  let attributes = {
    ...userinfoData,
    loggedInAgencyId: null,
    loggedInBranchId: user.loggedInBranchId,
  };

  attributes.loggedInAgencyId = await getAgencyIdByBranchId(
    attributes.loggedInBranchId,
    {
      getLoader: () => ({
        load: async (attr) => await search(attr),
      }),
    }
  );

  user.loggedInAgencyId = attributes?.loggedInAgencyId;

  if (!attributes.uniqueId) {
    const response = await getAccountsByLocalId(
      {
        userId: attributes.userId,
        agencyId: attributes.loggedInAgencyId,
      },
      {
        fetch: async (url, attr) => {
          const response = await fetch(url, attr);
          return { body: await response.text() };
        },
        getLoader: () => ({
          load: async (attr) => await search(attr),
        }),
      }
    );

    if (response?.omittedCulrData) {
      attributes.omittedCulrData = response.omittedCulrData;
    }
  }

  if (attributes.uniqueId && isFFULogin) {
    attributes = omitUserinfoCulrData(attributes);
  }

  user.omittedCulrData = attributes.omittedCulrData || null;

  const hasCPRValidatedAccount = !!attributes.agencies?.find?.(
    (agency) => agency.userIdType === "CPR"
  );

  const agencies = [];
  attributes.agencies?.forEach?.(({ agencyId }) => {
    if (!agencies.includes(agencyId)) {
      agencies.push(agencyId);
    }
  });

  user.userId = attributes.userId;
  user.identityProviderUsed = attributes.idpUsed;
  user.hasCulrUniqueId = !!attributes.uniqueId && !isFFULogin;
  user.isAuthenticated = !!attributes.userId && attributes.userId !== "@";
  user.municipalityAgencyId = await setMunicipalityAgencyId(attributes);
  user.agencies = agencies.length > 0 ? agencies : [];
  user.isCPRValidated =
    attributes.idpUsed === "nemlogin" || hasCPRValidatedAccount;

  const account = attributes.agencies?.find?.(
    (agency) => agency.userIdType === "CPR"
  );

  const userstatusResponse = await getOpenUserStatus({
    loggedInAgencyId: account?.agencyId || user?.loggedInAgencyId,
    userId: account?.userId || user?.userId,
  });

  if (userstatusResponse.status === 200) {
    const userstatusData = reduceBody(await userstatusResponse.json());
    user.name = userstatusData.name;
    user.mail = userstatusData.mail;
  }

  return res.status(200).send({ user });
}
