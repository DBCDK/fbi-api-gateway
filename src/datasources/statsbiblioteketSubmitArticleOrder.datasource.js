import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const { url, user, password } = config.datasources.statsbiblioteket;
const proxy = config.dmzproxy.url;

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
export async function load(params) {
  const requestString = createRequestString(params);
  const endpoint = `${url}/elba-webservices/services/placecopyrequest`;

  if (params.dryRun) {
    log.info("Elba service dryRun", { dryRunMessage: requestString });
    return { status: "OK" };
  }

  const res = proxy
    ? request
        .post(endpoint)
        .proxy(proxy)
        .set("Content-Type", "application/xml")
        .send(requestString)
    : request
        .post(endpoint)
        .set("Content-Type", "application/xml")
        .send(requestString);

  return res;
}
