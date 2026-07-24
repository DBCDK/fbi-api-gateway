import { log } from "dbc-node-logger";
import config from "../../config";
import { parseJSON, stringifyJSON } from "../../utils/json";
import monitor from "../../utils/monitor";
import { createRedisConnection } from "./index";

const { teamLabel } = config.datasources.websiteRedis;
const connection = createRedisConnection({
  host: config.datasources.websiteRedis.host,
  port: config.datasources.websiteRedis.port,
  prefix: config.datasources.websiteRedis.prefix,
  messages: {
    connecting: "Connecting to website Redis",
    connected: "Connected to website Redis",
    disconnected: "Disconnected from website Redis",
    errorPrefix: "Some website Redis error occured",
  },
});

/**
 * A monitored website redis get operation
 */
export const get = monitor(
  { name: "REQUEST_website_redis_get", help: "Website Redis get request" },
  async (key) => {
    try {
      const redis = connection.getRedis();
      const str = await redis.get(key);
      return await parseJSON(str);
    } catch (e) {
      log.error(`Website Redis get failed`, { key });
      return null;
    }
  }
);

/**
 * A monitored website redis set operation
 */
export const set = monitor(
  { name: "REQUEST_website_redis_set", help: "Website Redis set request" },
  async (key, seconds, val) => {
    try {
      const redis = connection.getRedis();
      const obj = { _redis_stored: Date.now(), val };
      const str = await stringifyJSON(obj);
      await redis.set(key, str, "EX", seconds);
    } catch (e) {
      log.error(`Website Redis setex failed`, {
        key,
        seconds,
      });
    }
  }
);

/**
 * A monitored website redis delete operation
 */
export const del = monitor(
  { name: "REQUEST_website_redis_del", help: "Website Redis del request" },
  async (key) => {
    try {
      const redis = connection.getRedis();
      await redis.del(key);
    } catch (e) {
      log.error(`Website Redis delete failed`, { key });
    }
  }
);

// Connect if website Redis is enabled
if (
  config.datasources.websiteRedis.enabled === true ||
  config.datasources.websiteRedis.enabled === "true"
) {
  connection.connect();
}

export { teamLabel };
