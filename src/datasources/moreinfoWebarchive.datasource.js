import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";

const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
  url,
  ttl,
  prefix,
  teamLabel,
} = config.datasources.moreinfo;

function createRequest(pid) {
  return `<mi:moreInfoRequest xmlns:mi="http://oss.dbc.dk/ns/moreinfo">
  <mi:authentication>
      <mi:authenticationUser>${authenticationUser}</mi:authenticationUser>
      <mi:authenticationGroup>${authenticationGroup}</mi:authenticationGroup>
      <mi:authenticationPassword>${authenticationPassword}</mi:authenticationPassword>
  </mi:authentication>
  <mi:identifier>
      <mi:pid>${pid}</mi:pid>
  </mi:identifier>
  <mi:outputType>json</mi:outputType>
</mi:moreInfoRequest>`;
}

// @TODO - handle net archive also - moreInfoResponse.identifierInformation.netArchive
export async function load(pid) {
  try {
    const archives = (
      await request.post(url).field("xml", createRequest(pid))
    ).body.moreInfoResponse.identifierInformation
      .map((entry) => entry.netArchive)
      .filter((entry) => entry);

    const res = [];
    archives.forEach((entry) => {
      entry.forEach((arc) => {
        res.push({ url: arc.$ });
      });
    });
    return res;
  } catch (e) {
    log.error(`Request to moreinfo failed for pid ${pid}`);
    return {};
  }
}

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export async function status(loadFunc) {
  await loadFunc("870970-basis:51877330");
}

export const options = {
  redis: {
    prefix: prefix + "-archive",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 90, // 90 days
  },
};

export { teamLabel };
