import { log } from "dbc-node-logger";
import Redis from "ioredis";
import config from "../../config";
import { parseJSON, stringifyJSON } from "../../utils/json";
import monitor from "../../utils/monitor";

const { teamLabel } = config.datasources.websiteRedis;
// Redis client
let redis;

// Variable indicating if we are connected
let isConnected = false;

/**
 * Connect to a Redis server and create event handlers
 *
 * @param {Object} params The params object
 * @param {string} params.host The Redis host
 * @param {number|string} params.port The Redis port
 * @param {string} params.prefix The Redis prefix
 */
function connectRedis({ host, port, prefix }) {
  log.info(`Connecting to website Redis`, {
    redisHost: host,
    redisPort: port,
    redisPrefix: prefix,
  });
  redis = new Redis.Cluster([{ host, port }], { keyPrefix: prefix });

  redis.on("ready", function () {
    isConnected = true;
    log.info(`Connected to website Redis`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix,
    });
  });

  redis.on("close", function () {
    if (!isConnected) {
      return;
    }
    isConnected = false;
    log.error(`Disconnected from website Redis`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix,
    });
  });

  redis.on("error", function (error) {
    if (!isConnected) {
      return;
    }
    log.error(`Some website Redis error occured: ${error.message}`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix,
    });
  });
}

/**
 * A monitored website redis get operation
 */
export const get = monitor(
  { name: "REQUEST_website_redis_get", help: "Website Redis get request" },
  async (key) => {
    try {
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
  connectRedis({
    host: config.datasources.websiteRedis.host,
    port: config.datasources.websiteRedis.port,
    prefix: config.datasources.websiteRedis.prefix,
  });
}

export { teamLabel };
