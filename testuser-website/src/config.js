let config = {};

export function setConfig(c) {
  config.anonymousToken = c.anonymousToken;
  config.fbiApiUrl =
    typeof location !== "undefined" && `${location.origin}/test/graphql`;
}

export default config;
