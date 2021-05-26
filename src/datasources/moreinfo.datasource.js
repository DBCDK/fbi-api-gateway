import request from "superagent";
import config from "../config";

const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
  url,
  ttl,
  prefix,
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

export async function load(pid) {
  const images = (
    await request.post(url).field("xml", createRequest(pid))
  ).body.moreInfoResponse.identifierInformation
    .map((entry) => entry.coverImage)
    .filter((entry) => entry);

  const res = {};
  images.forEach((entry) => {
    entry.forEach((cover) => {
      res[cover["@imageSize"].$] = cover.$;
    });
  });
  return res;
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
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 90, // 90 days
  },
};
