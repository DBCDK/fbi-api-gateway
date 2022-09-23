import promiseLimit from "promise-limit";
import { fetch } from "undici";

import diagnosticsChannel from "diagnostics_channel";
import { log } from "dbc-node-logger";

const { performance } = require("perf_hooks");

// This message is published when a new outgoing request is created.
diagnosticsChannel.channel("undici:request:create").subscribe(({ request }) => {
  request.timings = { create: performance.now() };
});

// This message is published right before the first byte of the request is written to the socket.
diagnosticsChannel
  .channel("undici:client:sendHeaders")
  .subscribe(({ request }) => {
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
        origin: request.origin,
        http_diagnostics: {
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

/**
 * Returns a fetch function that is concurrency limited.
 *
 * This is useful for avoiding a single incoming request consuming
 * too many resources, by making 1000s of outgoing HTTP requests in parallel.
 */
export function createFetchWithConcurrencyLimit(concurrency) {
  const limit = promiseLimit(concurrency);
  function fetchWithLimit(url, options) {
    return limit(() => fetch(url, options));
  }
  return fetchWithLimit;
}
