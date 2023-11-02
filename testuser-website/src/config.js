let config = {};

export function setConfig(c) {
  config.anonAccessToken = c.accessToken;
  config.callbackUrl = c.callbackUrl;
  config.csrfToken = c.csrfToken;
  config.fbiApiUrl = c.fbiApiUrl;
}

export default config;
