import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const { url, user, password } = config.datasources.statsbiblioteket;
const proxy = config.dmzproxy.url;

const map = {
  user: "ws_user",
  password: "ws_password",
  pickUpBranch: "pickupAgencyId",
  userLoanerId: "user_loaner_id",
  userInterestDate: "user_interest_date",
};

const whitelist = [
  "pid",
  "pickUpBranch",
  "userName",
  "userMail",
  "agencyId",
  "publicationDateOfComponent",
  "authorOfComponent",
  "titleOfComponent",
  "publicationTitle",
  "publicationYearOfComponent",
  "dbcOrderId",
  "userLoanerId",
  "userInterestDate",
  "pickUpAgencySubdivision",
  "issueOfComponent",
  "openURL",
  "pagesOfComponent",
  "volumeOfComponent",
];

function createRequestString(input) {
  const { volume, pagination, pagesOfComponent, volumeOfComponent } = input;
  const params = { ...input, user, password };

  // Set new params (remove in future) // //
  if (volume) {
    params.volumeOfComponent = volumeOfComponent || volume;
    // remove duplicate (remove in future)
    delete params.volume;
  }
  if (pagination) {
    params.pagesOfComponent = pagesOfComponent || pagination;
    // remove duplicate (remove in future)
    delete params.pagination;
  }
  // // // // // // // // // // // // // //

  let stringParams = "";
  Object.entries(params).forEach(([key, value]) => {
    if (whitelist.includes(key)) {
      key = map[key] || key;
      stringParams += `<${key}>${value}</${key}>`;
    }
  });

  return `
    <?xml version="1.0"?>
      <placeCopyRequest xmlns="http://statsbiblioteket.dk/xws/elba-placecopyrequest-schema">
        ${stringParams}
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

  if (params.dryRun) {
    console.log({ dryRun: true, requestString });
    return { status: "OK" };
  }

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

// return `
//     <?xml version="1.0"?>
//       <placeCopyRequest xmlns="http://statsbiblioteket.dk/xws/elba-placecopyrequest-schema">
//         <ws_user>${user}</ws_user>
//         <ws_password>${password}</ws_password>
//         <pid>${pid}</pid>
//         <agencyId>${agencyId}</agencyId>
//         <pickupAgencyId>${pickUpBranch}</pickupAgencyId>
//         <userName>${userName}</userName>
//         <userMail>${userMail}</userMail>
//         ${
//           authorOfComponent
//             ? `<authorOfComponent>${authorOfComponent}</authorOfComponent>`
//             : ""
//         }
//         ${
//           titleOfComponent
//             ? `<titleOfComponent>${titleOfComponent}</titleOfComponent>`
//             : ""
//         }
//         ${
//           publicationDateOfComponent
//             ? `<publicationDateOfComponent>${publicationDateOfComponent}</publicationDateOfComponent>`
//             : ""
//         }
//         ${volume ? `<volumeOfComponent>${volume}</volumeOfComponent>` : ""}
//         ${
//           pagination ? `<pagesOfComponent>${pagination}</pagesOfComponent>` : ""
//         }
//       </placeCopyRequest>`
