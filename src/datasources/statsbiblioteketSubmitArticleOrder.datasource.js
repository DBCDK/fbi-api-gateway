import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const { url, user, password } = config.datasources.statsbiblioteket;
const proxy = config.dmzproxy.url;

function createRequestString({
  pid,
  pickUpBranch,
  userName,
  userMail,
  agencyId,
  publicationDateOfComponent,
  volume,
  authorOfComponent,
  titleOfComponent,
  pagination,

  // new params
  publicationTitle,
  publicationDate,
  publicationYear,
  author,
  title,
  dbcOrderId,
  userLoanerId,
  userInterestDate,
  pickUpAgencySubdivision,
  issue,
  openURL,
}) {
  // Duplicated fields - should be removed in future
  publicationDate = publicationDate || publicationDateOfComponent;
  author = author || authorOfComponent;
  title = title || titleOfComponent;

  const map = {
    user: "ws_user",
    password: "ws_password",
    pickUpBranch: "pickupAgencyId",
    author: "authorOfComponent",
    title: "titleOfComponent",
    publicationDate: "publicationDateOfComponent",
    publicationYear: "publicationYearOfComponent",
    volume: "volumeOfComponent",
    pagination: "pagesOfComponent",
    issue: "issueOfComponent",
    userLoanerId: "user_loaner_id",
    userInterestDate: "user_interest_date",
  };

  return `
    <?xml version="1.0"?>
      <placeCopyRequest xmlns="http://statsbiblioteket.dk/xws/elba-placecopyrequest-schema">
        <ws_user>${user}</ws_user>
        <ws_password>${password}</ws_password>
        <pid>${pid}</pid>
        <agencyId>${agencyId}</agencyId>
        <pickupAgencyId>${pickUpBranch}</pickupAgencyId>
        <userName>${userName}</userName>
        <userMail>${userMail}</userMail>
        ${
          authorOfComponent
            ? `<authorOfComponent>${authorOfComponent}</authorOfComponent>`
            : ""
        }
        ${
          titleOfComponent
            ? `<titleOfComponent>${titleOfComponent}</titleOfComponent>`
            : ""
        }
        ${
          publicationDateOfComponent
            ? `<publicationDateOfComponent>${publicationDateOfComponent}</publicationDateOfComponent>`
            : ""
        }
        ${volume ? `<volumeOfComponent>${volume}</volumeOfComponent>` : ""}
        ${
          pagination ? `<pagesOfComponent>${pagination}</pagesOfComponent>` : ""
        }
      </placeCopyRequest>`
    .split(/\r?\n/)
    .filter((line) => !!line.trim())
    .join("\n");
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

  return null;

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
