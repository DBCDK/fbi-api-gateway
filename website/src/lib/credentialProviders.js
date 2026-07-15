/**
 * @file Shared server-side credential helpers for network detection, token
 * exchange, and building Smaug/user responses from resolved access tokens.
 */
import fetch from "isomorphic-unfetch";

import config from "../../../src/config.js";
import { parseClientPermissions } from "../../../commonUtils";
import { setMunicipalityAgencyId } from "../../../src/utils/municipalityAgencyId";
import { omitUserinfoCulrData } from "../../../src/utils/omitCulrData";
import { search } from "../../../src/datasources/library.datasource";
import { load as getAccountsByLocalId } from "../../../src/datasources/culrGetAccountsByLocalId.datasource";
import {
  _isFFUAgency,
  _hasCulrDataSync,
  getAgencyIdByBranchId,
} from "../../../src/utils/agency";
import { DISABLE_INTERNAL_NETWORK_CHECK_HEADER } from "../utils/credentialSettings";

const { authenticationUser, authenticationGroup, authenticationPassword } =
  config.datasources.openorder;
const TOKEN_ENDPOINT_URL = "https://login.bib.dk/oauth/token";
const CREDENTIAL_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.CREDENTIAL_FETCH_TIMEOUT_MS || config.fetchDefaultTimeoutMs,
  10
);

function isAbortError(error) {
  return error?.name === "AbortError";
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CREDENTIAL_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchLibraryResponse(url) {
  const response = await fetchWithTimeout(url, {
    method: "GET",
  });

  return {
    body: await response.json(),
  };
}

function createLibraryLoader() {
  return {
    load: async (attr) =>
      await search(attr, undefined, async (url) =>
        await fetchLibraryResponse(url)
      ),
  };
}

export function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const forwardedHeader = req.headers.forwarded;
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const realIpValue = Array.isArray(realIp) ? realIp[0] : realIp;
  const forwardedForMatch =
    typeof forwardedHeader === "string"
      ? forwardedHeader.match(/for="?([^;,\s"]+)/i)
      : null;

  const rawValue =
    forwardedValue?.split(",")?.[0]?.trim?.() ||
    realIpValue?.trim?.() ||
    forwardedForMatch?.[1] ||
    req.socket?.remoteAddress ||
    null;

  if (!rawValue) {
    return null;
  }

  return String(rawValue)
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/^::ffff:/i, "")
    .replace(/^for=/i, "");
}

export function isInternalIp(ip) {
  if (!ip) {
    return false;
  }

  const normalizedIp = String(ip).trim().toLowerCase();
  const ipv4Match = normalizedIp.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map((value) => Number.parseInt(value, 10));

    if (octets.some((value) => value < 0 || value > 255)) {
      return false;
    }

    return (
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    );
  }

  return (
    normalizedIp === "::1" ||
    normalizedIp.startsWith("fc") ||
    normalizedIp.startsWith("fd")
  );
}

export function isInternalRequest(req, options = {}) {
  const { ignoreDisableOverride = false } = options;
  const headerValue = req?.headers?.[DISABLE_INTERNAL_NETWORK_CHECK_HEADER];
  const disableInternalNetworkCheck =
    headerValue === "true" ||
    headerValue === "1" ||
    config.credentials?.disableInternalNetworkCheck;

  if (!ignoreDisableOverride && disableInternalNetworkCheck) {
    return false;
  }

  const ip = getRequestIp(req);

  if (!ip) {
    return false;
  }

  return isInternalIp(ip);
}

export async function getUserinfo(token, options = {}) {
  const url = config.datasources.userInfo.url;

  return await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getProfiles(agency, options = {}) {
  const url = config.datasources.vipcore.url;
  const version = process.env.VIPCORE_VERSION || "3";

  return await fetchWithTimeout(`${url}/opensearchprofile/${agency}/${version}`, {
    method: "GET",
  });
}

export async function getSmaugConfiguration(token, options = {}) {
  const url = config.datasources.smaug.url;
  return await fetchWithTimeout(`${url}/configuration?token=${token}`, {
    method: "GET",
  });
}

export async function getAccessTokenFromClientCredentials(
  clientId,
  clientSecret,
  options = {}
) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetchWithTimeout(TOKEN_ENDPOINT_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  return response;
}

function buildTokenState(tokenBody = {}) {
  const expiresIn = Number(tokenBody?.expires_in);
  const expiresAt =
    Number.isFinite(expiresIn) && expiresIn > 0
      ? Date.now() + expiresIn * 1000
      : null;

  return {
    token: tokenBody?.access_token || null,
    refreshToken: tokenBody?.refresh_token || null,
    tokenType: tokenBody?.token_type || "Bearer",
    expiresAt,
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : null,
  };
}

async function exchangeToken({
  clientId,
  clientSecret,
  grantType,
  refreshToken = null,
  username = null,
  password = null,
}) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const params = new URLSearchParams({
    grant_type: grantType,
  });

  if (grantType === "refresh_token" && refreshToken) {
    params.set("refresh_token", refreshToken);
  }

  if (grantType === "password") {
    params.set("username", username || "@");
    params.set("password", password || "@");
  }

  const response = await fetchWithTimeout(TOKEN_ENDPOINT_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (response.status !== 200) {
    return {
      status: response.status,
      grantTypeUsed: grantType,
      token: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
      expiresIn: null,
    };
  }

  const tokenBody = await response.json();

  return {
    status: tokenBody?.access_token ? 200 : 500,
    grantTypeUsed: grantType,
    ...buildTokenState(tokenBody),
  };
}

export async function refreshAccessToken({
  clientId,
  clientSecret,
  refreshToken,
}) {
  if (!clientId || !clientSecret || !refreshToken) {
    return {
      status: 428,
      token: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
      expiresIn: null,
    };
  }

  return await exchangeToken({
    clientId,
    clientSecret,
    grantType: "refresh_token",
    refreshToken,
  });
}

export function getInternalClientSecretForDate(date = new Date()) {
  return `enter_client_secret_${date.getDate()}`;
}

export async function getAccessTokenForClient({
  clientId,
  clientSecret = null,
  network = null,
  req = null,
}) {
  const isInternal =
    network === "internal" || (network === null && req && isInternalRequest(req));
  const effectiveClientSecret =
    clientSecret || (isInternal ? getInternalClientSecretForDate() : null);

  if (!clientId || !effectiveClientSecret) {
    return {
      status: 428,
      clientSecretUsed: false,
      grantTypeUsed: null,
      token: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
      expiresIn: null,
    };
  }

  const grantAttempts = [
    {
      grantType: "password",
      username: "@",
      password: "@",
    },
    {
      grantType: "client_credentials",
    },
  ];

  let lastAttempt = {
    status: 500,
    grantTypeUsed: null,
    token: null,
    refreshToken: null,
    tokenType: null,
    expiresAt: null,
    expiresIn: null,
  };

  for (const attempt of grantAttempts) {
    const tokenState = await exchangeToken({
      clientId,
      clientSecret: effectiveClientSecret,
      grantType: attempt.grantType,
      username: attempt.username,
      password: attempt.password,
    });

    if (tokenState.status === 200 && tokenState.token) {
      return {
        status: 200,
        clientSecretUsed: !!clientSecret,
        grantTypeUsed: tokenState.grantTypeUsed,
        token: tokenState.token,
        refreshToken: tokenState.refreshToken,
        tokenType: tokenState.tokenType,
        expiresAt: tokenState.expiresAt,
        expiresIn: tokenState.expiresIn,
      };
    }

    lastAttempt = tokenState;
  }

  return {
    status: lastAttempt.status,
    clientSecretUsed: !!clientSecret,
    grantTypeUsed: lastAttempt.grantTypeUsed,
    token: null,
    refreshToken: null,
    tokenType: null,
    expiresAt: null,
    expiresIn: null,
  };
}

export function selectProfiles(data) {
  return data?.profile?.map((profile) => profile.profileName);
}

export function selectConfiguration(data) {
  const permissions = parseClientPermissions({ smaug: data });
  const agencies = data.gateway?.agencies?.ids;
  const grants = Array.isArray(data?.app?.grants)
    ? data.app.grants
    : Array.isArray(data?.grants)
      ? data.grants
      : [];

  return {
    displayName: data.displayName,
    logoColor: data.logoColor,
    clientId: data.app?.clientId,
    grants,
    supportsRefreshToken: grants.includes("refresh_token"),
    userId: data.user?.id,
    uniqueId: data.user?.uniqueId,
    permissions,
    agency: data.agencyId,
    agencies,
    alwaysRequireAgencyId:
      data.gateway?.agencies?.alwaysRequireAgencyId || false,
    expires: data.expires,
  };
}

function constructSoap({ agencyId, userId }) {
  return `
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
}

function reduceUserStatusBody(body) {
  return {
    name: body?.getUserStatusResponse?.userName?.$,
    mail: body?.getUserStatusResponse?.userMail?.$,
  };
}

export async function getOpenUserStatus(
  { loggedInAgencyId, userId },
  options = {}
) {
  const { url } = config.datasources.openuserstatus;

  return await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
    },
    body: constructSoap({
      agencyId: loggedInAgencyId,
      userId,
    }),
  });
}

export async function buildConfigurationResponse(
  token,
  selectedAgency = null,
  options = {}
) {
  const smaugResponse = await getSmaugConfiguration(token, options);

  if (smaugResponse.status !== 200) {
    return { status: smaugResponse.status, body: {} };
  }

  const smaugData = await smaugResponse.json();
  const configuration = selectConfiguration(smaugData);
  const fallbackAgency = configuration.agencies?.[0] || null;
  const profileAgency =
    selectedAgency || configuration.agency || fallbackAgency || null;

  let result = { ...configuration };

  if (configuration.userId) {
    const userinfoResponse = await getUserinfo(token, options);
    if (userinfoResponse.status !== 200) {
      return { status: 401, body: {} };
    }
  }

  if (profileAgency) {
    const vipcoreResponse = await getProfiles(profileAgency, options);

    if (vipcoreResponse.status === 200) {
      const vipcoreData = await vipcoreResponse.json();
      result = {
        ...result,
        agency: profileAgency,
        defaultAgency: configuration.agency,
        profiles: selectProfiles(vipcoreData),
      };
    } else {
      result = {
        ...result,
        agency: profileAgency,
        defaultAgency: configuration.agency,
        profiles: ["none"],
      };
    }
  }

  return { status: 200, body: result };
}

export async function buildUserResponse(token, options = {}) {
  let smaugResponse;

  try {
    smaugResponse = await getSmaugConfiguration(token, options);
  } catch (error) {
    if (isAbortError(error)) {
      return { status: 200, body: {} };
    }

    throw error;
  }

  if (smaugResponse.status !== 200) {
    return { status: 404, body: {} };
  }

  const smaugData = await smaugResponse.json();
  const user = {
    loggedInAgencyId: smaugData?.user?.agency || null,
  };

  const isFFULogin =
    _isFFUAgency(smaugData?.user?.agency) &&
    !_hasCulrDataSync(smaugData?.user?.agency);

  let userinfoResponse;

  try {
    userinfoResponse = await getUserinfo(token, options);
  } catch (error) {
    if (isAbortError(error)) {
      return { status: 200, body: user };
    }

    throw error;
  }

  if (userinfoResponse.status !== 200) {
    return { status: 200, body: user };
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
      getLoader: () => createLibraryLoader(),
    }
  );

  user.loggedInAgencyId = attributes?.loggedInAgencyId;

  if (!attributes.uniqueId) {
    try {
      const response = await getAccountsByLocalId(
        {
          userId: attributes.userId,
          agencyId: attributes.loggedInAgencyId,
        },
        {
          fetch: async (url, attr) => {
            const res = await fetchWithTimeout(url, attr);
            return { body: await res.text() };
          },
          getLoader: () => createLibraryLoader(),
        }
      );

      if (response?.omittedCulrData) {
        attributes.omittedCulrData = response.omittedCulrData;
      }
    } catch (error) {
      if (!isAbortError(error)) {
        throw error;
      }
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

  try {
    const userstatusResponse = await getOpenUserStatus(
      {
        loggedInAgencyId: account?.agencyId || user?.loggedInAgencyId,
        userId: account?.userId || user?.userId,
      },
      options
    );

    if (userstatusResponse.status === 200) {
      const userstatusData = reduceUserStatusBody(await userstatusResponse.json());
      user.name = userstatusData.name;
      user.mail = userstatusData.mail;
    }
  } catch (error) {
    if (!isAbortError(error)) {
      throw error;
    }
  }

  return { status: 200, body: user };
}
