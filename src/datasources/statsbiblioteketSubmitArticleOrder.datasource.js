import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const { url, user, password } = config.datasources.statsbiblioteket;

function createRequestString({
  pid,
  pickUpBranch,
  userName,
  userMail,
  agencyId,
}) {
  return `<?xml version="1.0"?>
  <placeCopyRequest xmlns="http://statsbiblioteket.dk/xws/elba-placecopyrequest-schema">
    <ws_user>${user}</ws_user>
    <ws_password>${password}</ws_password>
    <pid>${pid}</pid>
    <agencyId>${agencyId}</agencyId>
    <pickupAgencyId>${pickUpBranch}</pickupAgencyId>
    <userName>${userName}</userName>
    <userMail>${userMail}</userMail>
  </placeCopyRequest>`;
}

/**
 * Submits order
 * @param {object} params
 * @param {string} params.pid
 * @param {string} params.pickUpBranch
 * @param {object} params.user
 */
export async function load({
  pid,
  pickUpBranch,
  userName,
  userMail,
  agencyId,
}) {
  const requestString = createRequestString({
    pid,
    pickUpBranch,
    userName,
    userMail,
    agencyId,
  });
  const endpoint = `${url}/elba-webservices/services/placecopyrequest`;

  const res = await request
    .post(endpoint)
    .set("Content-Type", "application/xml")
    .send(requestString);

  return res;
}
