import request from "superagent";
import config from "../config";

export async function load() {
  const res = (
    await request
      .get(`${config.datasources.statsbiblioteket.url}/copydanws/subscribers`)
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
    prefix: "statsbiblioteketSubs",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
    inMemory: true,
  },
};
