import promiseLimit from "promise-limit";

import { log } from "dbc-node-logger";
import { parseJSON } from "./json";
import { fetch } from "./fetchWorker";
import config from "../config";
import { nameToDatasource } from "../datasourceLoader";

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
  function createStatsEntry(name, status) {
    if (!stats[name]) {//TODO file names are not the same as name in config
      const teamLabel = nameToDatasource[name]?.teamLabel;
      stats[name] = { service: name, status: {}, errors: 0,teamLabel: teamLabel };
    }
    if (status && !stats[name].status[status]) {
      stats[name].status[status] = 0;
    }
  }

  return {
    insertStats(name, res) {
      const { ok, status } = res;

      createStatsEntry(name, status);

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
    setAllowedErrorStatusCodes(name, codes) {
      createStatsEntry(name);
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
export function createFetchWithConcurrencyLimit(concurrency, stats) {
  const limit = promiseLimit(concurrency);

  // The actual fetch function, that handles errors
  return function fetchWithLimit(url, options, name) {
    return limit(async () => {
      // Retrieve the options for this request
      const fetchOptions = { ...options };
      const allowedErrorStatusCodes = options?.allowedErrorStatusCodes || [];
      delete fetchOptions.allowedErrorStatusCodes;

      httpStats.setAllowedErrorStatusCodes(name, allowedErrorStatusCodes);

      // Perform the request in the fetch thread
      const res = await fetch(url, fetchOptions);

      // Collect HTTP metric
      httpStats.insertStats(name, res);

      let text;
      try {
        text = Buffer.from(res.buffer)?.toString();
        return {
          status: res.status,
          body: await parseJSON(text, res.timings),
          ok: res.ok,
        };
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
