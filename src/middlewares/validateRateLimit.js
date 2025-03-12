import { incr } from "../datasources/redis.datasource";
import config from "../config";
import { log } from "dbc-node-logger";

import createHash from "../utils/hash";
import isbot from "isbot";

const { expireSeconds, prefix, max } = config.rateLimit;

export async function validateRateLimit(req, res, next) {
  const clientId = req.smaug?.app?.clientId;

  // Return if no clientId
  if (!clientId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const redisKey = `${prefix}:${clientId}`;
  const RATE_LIMIT = req.smaug?.gateway?.maxRequestsPerMinute || max;

  let count;

  try {
    count = await incr(redisKey, expireSeconds);
  } catch (error) {
    log.error("Redis error in rate limiting", { error: error.message });

    count = 0; // Fallback, som betyder, at vi ikke begrænser
  }

  const userAgent = req.get("User-Agent") || "";
  const userAgentIsBot = isbot(userAgent) || false;
  const accessTokenHash = createHash(req.accessToken);

  if (count > RATE_LIMIT) {
    log.info("Rate limit exceeded", {
      clientId,
      userAgent,
      userAgentIsBot,
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
