/*
@file - submit an article to statsbiblioteket- it is a soap xml service

see https://webservice.statsbiblioteket.dk/elba-webservices/

some parameters are mandatory (minOccurs="1" maxOccurs="1") but are not implemented
here - if schema validation is enabled at a later time this request will fail.

eg. <xsd:element name="originRequester" type="xsd:string" minOccurs="1" maxOccurs="1"/>
 */
import { log } from "dbc-node-logger";
import config from "../config";

const { url, user, password } = config.datasources.statsbiblioteket;

// map fbi-api key-names to elba-service keys
const map = {
  user: "ws_user",
  password: "ws_password",
  pickUpBranch: "pickupAgencyId",
  userLoanerId: "user_loaner_id",
  userInterestDate: "user_interest_date",
  // keys deprecated in future:
  volume: "volumeOfComponent",
  pagination: "pagesOfComponent",
  originRequester: "originRequester",
};

// list ordered by elba-service xsd
const whitelist = [
  "user",
  "password",
  "dbcOrderId",
  "pid",
  "userLoanerId",
  "userName",
  "userMail",
  "userInterestDate",
  "pickUpBranch",
  "agencyId",
  "pickUpAgencySubdivision",
  "publicationTitle",
  "authorOfComponent",
  "titleOfComponent",
  "publicationDateOfComponent",
  "publicationYearOfComponent",
  "issueOfComponent",
  "volumeOfComponent",
  // volume deprecated in future
  "volume",
  "pagesOfComponent",
  // pagination deprecated in future
  "pagination",
  "openURL",
  "originRequester",
];

function createRequestString(input) {
  const params = { ...input, user, password };

  let stringParams = ``;
  whitelist.forEach((key) => {
    if (params[key]) {
      stringParams += `<${map[key] || key}>${params[key]}</${
        map[key] || key
      }> \n`;
    }
  });

  return `
  <?xml version="1.0"?>
  <placeCopyRequest xmlns="http://statsbiblioteket.dk/xws/elba-placecopyrequest-schema">
  ${stringParams}
  </placeCopyRequest>`
    .split(/\r?\n/)
    .join("\n")
    .trim();
}

/**
 * Submits order
 * @param {object} params
 * @param {string} params.pid
 * @param {string} params.pickUpBranch
 * @param {object} params.user
 */
export async function load(params, context) {
  const requestString = createRequestString(params);
  const endpoint = `${url}/elba-webservices/services/placecopyrequest`;

  if (params.dryRun) {
    log.info("Elba service dryRun", { dryRunMessage: requestString });
    return { status: "OK" };
  }

  const res = await context?.fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
    },
    body: requestString,
    enableProxy: true,
  });

  /** pjo 12/1/23 - service now returns 204 - No content **/
  if (res.status === 200 || res.status === 204) {
    log.info("Elba: Periodica article order succes", {
      params,
      accessToken: context.accessToken,
    });

    // Logging for analytics
    context?.tracking?.collect({
      action: "DIGITAL_ARTICLE_ORDER",
      pid: params?.pid,
      originRequester: params?.originRequester,
      agencyId: params?.agencyId,
    });

    return { status: "OK" };
  }

  log.error("Elba: Periodica article order failed", {
    error: JSON.stringify(res),
  });
  return {
    status: "ERROR_PID_NOT_RESERVABLE",
  };
}

export function testLoad() {
  return { status: "OK" };
}

export const options = {
  external: true,
};
