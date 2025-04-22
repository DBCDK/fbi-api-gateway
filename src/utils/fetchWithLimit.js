import promiseLimit from "promise-limit";

import { log } from "dbc-node-logger";
import { parseJSON } from "./json";
import { fetch } from "./fetchWorker";
import config from "../config";

/**
 * Factory function that creates object for collecting
 * HTTP metrics
 */
function createHTTPStats() {
  const stats = {};
  let prevStats;

  /**
   * Creates entry in stats object for a service
   * if it does not already exist
   */
  function createStatsEntry(name, status, teamLabel) {
    if (!stats[name]) {
      stats[name] = { service: name, status: {}, errors: 0, teamLabel };
    }
    if (status && !stats[name].status[status]) {
      stats[name].status[status] = 0;
    }
  }

  return {
    insertStats(name, res, teamLabel) {
      const { ok, status } = res;

      createStatsEntry(name, status, teamLabel);

      stats[name].status[status]++;

      const { allowedErrorStatusCodes } = stats[name];

      if (!ok && !allowedErrorStatusCodes.includes(status)) {
        stats[name].errors++;
        log.error(`Datasource error, ${name}`, {
          error: `Disallowed error status ${status}, expected one of ${allowedErrorStatusCodes.join(
            ", "
          )}`,
        });
      }
    },
    setAllowedErrorStatusCodes(name, codes, teamLabel) {
      createStatsEntry(name, null, teamLabel);
      stats[name].allowedErrorStatusCodes = codes;
    },
    getStats() {
      // Make a copy so we don't mess with original
      const copy = JSON.parse(JSON.stringify(stats));

      const res = Object.values(copy).map((entry) => {
        return {
          ...entry,
          prevErrors: prevStats?.[entry.service]?.errors || 0,
        };
      });

      prevStats = copy;

      return res;
    },
  };
}

const httpStats = createHTTPStats();

export function getStats() {
  return httpStats.getStats();
}

/**
 * Returns a fetch function that is concurrency limited.
 *
 * This is useful for avoiding a single incoming request consuming
 * too many resources, by making 1000s of outgoing HTTP requests in parallel.
 *
 * And it handles errors (logging, and counting)
 */
export function createFetchWithConcurrencyLimit(concurrency, stats, debugObj) {
  if (debugObj) {
    debugObj.requests = [];
  }

  const limit = promiseLimit(concurrency);

  // The actual fetch function, that handles errors
  return function fetchWithLimit(url, options, name, teamLabel, allowDebug) {
    return limit(async () => {
      // Retrieve the options for this request
      const fetchOptions = { ...options };
      const allowedErrorStatusCodes = options?.allowedErrorStatusCodes || [];
      delete fetchOptions.allowedErrorStatusCodes;

      httpStats.setAllowedErrorStatusCodes(
        name,
        allowedErrorStatusCodes,
        teamLabel
      );

      // Perform the request in the fetch thread
      const res = await fetch(url, fetchOptions);

      // Collect HTTP metric
      httpStats.insertStats(name, res, teamLabel);

      let text;
      try {
        text = Buffer.from(res.buffer)?.toString();

        const final = {
          status: res.status,
          body: await parseJSON(text, res.timings),
          ok: res.ok,
        };

        // When debug mode is enabled and allowed for this datasource,
        // log the full request/response pair for inspection in GraphQL extensions.debug
        if (allowDebug && debugObj) {
          debugObj.requests.push({
            request: {
              timestamp: new Date().getTime(),
              url,
              options: fetchOptions,
              timings: res.timings,
            },
            response: final,
          });
        }

        return final;
      } catch (parseError) {
        return { status: res.status, body: text, ok: res.ok };
      } finally {
        // Log request timings
        log.info("HTTP", {
          datasourceName: name,
          diagnostics: {
            ...res.timings,
            status: `${res.status}`,
            allowedStatus:
              res.ok || allowedErrorStatusCodes.includes(res.status),
          },
        });
        // Add to track object for incoming graphql request
        stats.addHTTP(name, res.timings);
      }
    });
  };
}
