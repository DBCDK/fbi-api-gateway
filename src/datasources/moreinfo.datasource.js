import request from "superagent";
import config from "../config";
import monitor from "../utils/monitor";
import { withRedis } from "./redis.datasource";

const {
  authenticationUser,
  authenticationGroup,
  authenticationPassword,
  url,
  ttl,
  prefix
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

async function fetchMoreInfo({ pid }) {
  const images = (
    await request.post(url).field("xml", createRequest(pid))
  ).body.moreInfoResponse.identifierInformation
    .map(entry => entry.coverImage)
    .filter(entry => entry);

  const res = {};
  images.forEach(entry => {
    entry.forEach(cover => {
      res[cover["@imageSize"].$] = cover.$;
    });
  });
  return res;
}

// fetchMoreInfo monitored
const monitored = monitor(
  { name: "REQUEST_moreinfo", help: "moreinfo request" },
  fetchMoreInfo
);

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export async function status() {
  await fetchMoreInfo({ pid: "870970-basis:51877330" });
}

/**
 * A DataLoader batch function
 *
 * Could be optimised to fetch all pids in a single
 * more info request.
 *
 * @param {Array.<string>} keys The keys to fetch
 */
async function batchLoader(keys) {
  return await Promise.all(
    keys.map(async key => await monitored({ pid: key }))
  );
}

/**
 * Enhance batch function with Redis caching
 */
export default withRedis(batchLoader, {
  prefix,
  ttl
});
