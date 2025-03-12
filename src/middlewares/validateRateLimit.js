import { incr } from "../datasources/redis.datasource";
import config from "../config";
import { log } from "dbc-node-logger";

import createHash from "../utils/hash";
import isbot from "isbot";

const { expireSeconds, prefix, max } = config.rateLimit;

export async function validateRateLimit(req, res, next) {
  const clientId = req.smaug?.app?.clientId;

  // We do not count introspection queries

  // Return if no clientId
  if (!clientId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // unique key for the client (including global prefix for cache reset)
  const redisKey = `${prefix}:${clientId}`;

  // get the rate limit from smaug settings (fallbacks to config max)
  const RATE_LIMIT = req.smaug?.gateway?.maxRequestsPerMinute || max;

  // increment the count
  const count = await incr(redisKey, expireSeconds);

  const userAgent = req.get("User-Agent");

  const accessTokenHash = createHash(req.accessToken);

  if (count > RATE_LIMIT) {
    // Rate limit exceeded info log
    log.info("Rate limit exceeded", {
      clientId: req?.smaug?.app?.clientId,
      userAgent,
      userAgentIsBot: isbot(userAgent),
      ip: req?.smaug?.app?.ips?.[0],
      accessTokenHash,
    });

    return res.status(429).send({
      statusCode: 429,
      message: "Too many requests!",
    });
  }

  next();
}
