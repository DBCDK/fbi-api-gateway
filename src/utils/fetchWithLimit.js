import promiseLimit from "promise-limit";
import { fetch } from "undici";

import diagnosticsChannel from "diagnostics_channel";
import { log } from "dbc-node-logger";
import { ProxyAgent } from "undici";
import config from "../config";

// A proxy dispatcher, used for fetch requests
// that must go through the proxy
const proxyDispatcher = config.dmzproxy.url
  ? new ProxyAgent(config.dmzproxy.url)
  : null;

const { performance, PerformanceObserver } = require("perf_hooks");

// Log dns and tcp connect durations
const obs = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.duration > 500) {
      if (entry.name === "lookup") {
        log.info("DNS_DIAGNOSTICS", {
          diagnostics: {
            hostname: entry.detail.hostname,
            total: entry.duration,
          },
        });
      } else if (entry.name === "connect") {
        log.info("CONNECT_DIAGNOSTICS", {
          diagnostics: {
            host: entry.detail.host,
            total: entry.duration,
          },
        });
      }
    }
  });
});
obs.observe({ entryTypes: ["dns", "net"], buffered: true });

// This message is published when a new outgoing request is created.
diagnosticsChannel.channel("undici:request:create").subscribe(({ request }) => {
  request.timings = { create: performance.now() };
});

// This message is published right before the first byte of the request is written to the socket.
diagnosticsChannel
  .channel("undici:client:sendHeaders")
  .subscribe(({ request, socket }) => {
    request.timings.sendHeaders = performance.now();
  });

// Body is sent
diagnosticsChannel
  .channel("undici:request:bodySent")
  .subscribe(({ request }) => {
    request.timings.bodySent = performance.now();
  });

// response headers received
diagnosticsChannel
  .channel("undici:request:headers")
  .subscribe(({ request }) => {
    request.timings.headers = performance.now();
  });

// This message is published after the response body and trailers have been received,
// i.e. the response has been completed.
diagnosticsChannel
  .channel("undici:request:trailers")
  .subscribe(({ request }) => {
    const now = performance.now();
    const total = now - request.timings.create;
    if (total > 2000) {
      log.info("HTTP_DIAGNOSTICS", {
        diagnostics: {
          origin: request.origin,
          connectionStart: request.timings.sendHeaders - request.timings.create,
          requestSent: request.timings.bodySent - request.timings.sendHeaders,
          waitingForServerResponse:
            request.timings.headers - request.timings.bodySent,
          contentDownload: now - request.timings.headers,
          total,
        },
      });
    }
  });

const stats = {};
let prevStats;
export function getStats() {
  // Make a copy so we don't mess with original
  const copy = JSON.parse(JSON.stringify(stats));

  const res = Object.values(copy).map((entry) => {
    return { ...entry, prevErrors: prevStats?.[entry.service]?.errors || 0 };
  });

  prevStats = copy;

  return res;

  // Return a copy of stats
  // return JSON.parse(JSON.stringify(stats));
}
function insertStats(name, status, error) {
  if (!stats[name]) {
    stats[name] = { service: name, status: {}, errors: 0 };
  }
  if (!stats[name].status[status]) {
    stats[name].status[status] = 0;
  }
  if (error) {
    stats[name].errors++;
  }
  stats[name].status[status]++;
}

function setAllowedErrorStatusCodes(name, codes) {
  if (!stats[name]) {
    stats[name] = { service: name, status: {}, errors: 0 };
  }
  stats[name].allowedErrorStatusCodes = codes;
}

/**
 * Returns a fetch function that is concurrency limited.
 *
 * This is useful for avoiding a single incoming request consuming
 * too many resources, by making 1000s of outgoing HTTP requests in parallel.
 *
 * And it handles errors (logging, and counting)
 */
export function createFetchWithConcurrencyLimit(concurrency) {
  const limit = promiseLimit(concurrency);

  // This function makes the datasource name available to
  // the fetch function via closure.
  return function createFetchWithName(name) {
    // The actual fetch function, that handles errors
    function fetchWithLimit(url, options) {
      return limit(async () => {
        try {
          // Retrieve the options for this request
          const fetchOptions = { ...options };
          const allowedErrorStatusCodes =
            options?.allowedErrorStatusCodes || [];
          const enableProxy = options?.enableProxy;
          delete fetchOptions.allowedErrorStatusCodes;
          delete fetchOptions.enableProxy;

          setAllowedErrorStatusCodes(name, allowedErrorStatusCodes);

          // Set proxy if required
          if (enableProxy && proxyDispatcher) {
            fetchOptions.dispatcher = proxyDispatcher;
          }

          // Perform the request
          const res = await fetch(url, fetchOptions);

          // Check that the response status code is what we expect
          // for this particular data source
          if (!res.ok && !allowedErrorStatusCodes.includes(res.status)) {
            insertStats(name, res.status, true);
            log.error(`Datasource error, ${name}`, {
              error: `Unexpected status ${
                res.status
              }, expected one of ${allowedErrorStatusCodes.join(", ")}`,
            });
          } else {
            insertStats(name, res.status);
          }

          // Return the body as either plain text or an object
          const text = await res.text();
          try {
            return { status: res.status, body: JSON.parse(text), ok: res.ok };
          } catch (parseError) {
            return { status: res.status, body: text, ok: res.ok };
          }
        } catch (e) {
          // Some network error occured

          log.error(`Datasource error, ${name}`, {
            error: String(e),
            cause: JSON.stringify(e?.cause),
          });

          insertStats(name, e?.cause?.code, true);

          return { status: e?.cause?.code, body: null, ok: false };
        }
      });
    }
    return fetchWithLimit;
  };
}
