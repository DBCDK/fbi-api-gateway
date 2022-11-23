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

function createMultiRequest(pids) {
  return `<mi:moreInfoRequest xmlns:mi="http://oss.dbc.dk/ns/moreinfo">
  <mi:authentication>
      <mi:authenticationUser>${authenticationUser}</mi:authenticationUser>
      <mi:authenticationGroup>${authenticationGroup}</mi:authenticationGroup>
      <mi:authenticationPassword>${authenticationPassword}</mi:authenticationPassword>
  </mi:authentication>
  
  ${pids
    .map(
      (pid) => `<mi:identifier>
    <mi:pid>${pid}</mi:pid>
</mi:identifier>`
    )
    .join("\n")}
  <mi:outputType>json</mi:outputType>
</mi:moreInfoRequest>`;
}

// @TODO - handle net archive also - moreInfoResponse.identifierInformation.netArchive
export async function load(pid) {
  try {
    const images = (
      await request.post(url).field("xml", createRequest(pid))
    ).body.moreInfoResponse.identifierInformation
      .map((entry) => entry.coverImage)
      .filter((entry) => entry);

    const res = {};
    images.forEach((entry) => {
      entry.forEach((cover) => {
        res[cover["@imageSize"].$] = cover.$;
        res["origin"] = "moreinfo";
      });
    });

    return res;
  } catch (e) {
    if (e.status !== 404) {
      log.error(`Request to moreinfo failed for pid ${pid}`, {
        error: String(e),
        stacktrace: e.stack,
      });
      return {
        ok: false,
        message: String(e),
      };
    }

    return {};
  }
}

/**
 * A DataLoader batch function
 *
 * @param {Array.<string|object>} keys The keys to fetch
 */
export async function batchLoader(keys, loadFunc) {
  try {
    const images = (
      await request.post(url).field("xml", createMultiRequest(keys))
    ).body.moreInfoResponse.identifierInformation.map(
      (entry) => entry.coverImage
    );

    return images.map((entry) => {
      const res = {};
      entry?.forEach((cover) => {
        res[cover["@imageSize"].$] = cover.$;
        res["origin"] = "moreinfo";
      });
      return res;
    });
  } catch (e) {
    if (e.status !== 404) {
      log.error(`Request to moreinfo failed for pid ${keys.join(",")}`, {
        error: String(e),
        stacktrace: e.stack,
      });
      return {
        ok: false,
        message: String(e),
      };
    }

    return keys.map(() => ({}));
  }
}

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export async function status(loadFunc) {
  const test = await loadFunc("870970-basis:51877330");
  if (test.ok === false) {
    throw { message: test.message };
  }
}

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 90, // 90 days
  },
};
