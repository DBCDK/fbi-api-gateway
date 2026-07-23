import { log } from "dbc-node-logger";
import Redis from "ioredis";

/**
 * Create a shared Redis cluster connection runtime with standard logging and
 * connection state handling. Concrete datasource files build their own
 * operations on top of the returned accessors.
 *
 * @param {Object} params The params object
 * @param {string} params.host The Redis host
 * @param {number|string} params.port The Redis port
 * @param {string} params.prefix The Redis prefix
 * @param {Object} params.messages Log messages for connection lifecycle
 * @param {string} params.messages.connecting Message logged before connect
 * @param {string} params.messages.connected Message logged on ready
 * @param {string} params.messages.disconnected Message logged on close
 * @param {string} params.messages.errorPrefix Prefix used for error logs
 * @returns {Object} Runtime helpers for Redis access
 */
export function createRedisConnection({
  host,
  port,
  prefix,
  messages,
}) {
  let redis;
  let isConnected = false;

  function getMetadata() {
    return {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix,
    };
  }

  function connect() {
    log.info(messages.connecting, getMetadata());
    redis = new Redis.Cluster([{ host, port }], { keyPrefix: prefix });

    redis.on("ready", function () {
      isConnected = true;
      log.info(messages.connected, getMetadata());
    });

    redis.on("close", function () {
      if (!isConnected) {
        return;
      }
      isConnected = false;
      log.error(messages.disconnected, getMetadata());
    });

    redis.on("error", function (error) {
      if (!isConnected) {
        return;
      }
      log.error(`${messages.errorPrefix}: ${error.message}`, getMetadata());
    });
  }

  return {
    connect,
    getRedis: () => redis,
    isConnected: () => isConnected,
  };
}
