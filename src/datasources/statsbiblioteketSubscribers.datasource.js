import request from "superagent";
import config from "../config";

require("superagent-proxy")(request);

export async function load() {
  const proxy = config.dmzproxy.url;

  const res = proxy
    ? (
        await request
          .get(
            `${config.datasources.statsbiblioteket.url}/copydanws/subscribers`
          )
          .set("Accept", "application/json")
      ).body
    : (
        await request
          .get(
            `${config.datasources.statsbiblioteket.url}/copydanws/subscribers`
          )
          .proxy(proxy)
          .set("Accept", "application/json")
      ).body;

  const subscriberMap = res.subscribers.subscriber.reduce((map, subscriber) => {
    map[subscriber.isil.replace(/\D/g, "")] = 1;
    return map;
  }, {});

  return subscriberMap;
}

export const options = {
  redis: {
    prefix: "statsbiblioteketSubs2",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
    inMemory: true,
  },
};
