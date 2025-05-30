import { log } from "dbc-node-logger";
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

/**
 * A DataLoader batch function
 *
 * @param {Array.<string|object>} keys The keys to fetch
 */
export async function batchLoader(keys, context) {
  try {
    const images = (
      await context.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "&xml=" + createMultiRequest(keys),
      })
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

export const options = {
  redis: {
    prefix,
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 90, // 90 days
  },
};

export { teamLabel };
