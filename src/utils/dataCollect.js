import { log } from "dbc-node-logger";

/**
 * Middleware that attaches a collect function to the request context.
 * The collect function sanitizes and logs the object with the following modifications:
 *  - Replaces underscores (_) with hyphens (-) in keys
 *  - Excludes keys with empty array values in specific filters
 *  - Adds session and user identification details
 *  - Overrides specific properties if tracking consent is not given
 */
export function dataCollectMiddleware(req, res, next) {
  const consent = req.headers["x-tracking-consent"] === "true";
  const uniqueVisitorId = req.headers["x-unique-visitor-id"];
  const context = req;
  function collect(obj) {
    // Convert keys, replace _ to -
    let data = {
      ip: context.smaug.app.ips[0],
      profile: { agency: context.profile?.agency, name: context.profile?.name },
    };
    Object.entries(obj).forEach(([key, val]) => {
      data[key.replace(/_/g, "-")] = val;
    });

    // Remove keys where value is empty array
    if (data?.["search-request"]?.filters) {
      const filters = {};
      Object.entries(data["search-request"].filters).forEach(([key, value]) => {
        if (value?.length > 0) {
          filters[key] = value;
        }
      });
      data["search-request"].filters = filters;
    }

    data["session-id"] = uniqueVisitorId;
    data["user-id"] =
      context.user?.uniqueId ||
      (context.user?.userId ? createHash(context.user?.userId) : null);
    data["tracking-consent"] = consent;

    // Override some properties, if user has not given consent to tracking
    if (!consent) {
      data = {
        ...data,
        ip: null,
        "session-id": null,
        "user-id": null,
      };
    }

    // We log the object, setting 'type: "data"' on the root level
    // of the log entry. In this way the data will be collected
    // by the AI data collector
    log.info(JSON.stringify(data), { type: "data" });
  }
  req.tracking = {
    consent,
    uniqueVisitorId,
    collect,
  };

  next();
}
