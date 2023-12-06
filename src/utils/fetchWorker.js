/**
 * @file Runs undici fetch in a worker thread
 *
 * Why is this useful?
 * This will not make the application run faster, but it is done solely
 * to have reliable and precise HTTP timings.
 *
 * The worker thread is only responsible for data fetching - no JSON parsing.
 *
 * On the other hand, collecting timings via the main thread, has shown to
 * be unprecise, when the thread is under heavy load. The event loop is blocked
 * so much, that logging the actual timings are waiting.
 *
 * The overhead of running undici in a worker thread should be minimal,
 * du to the fact that the payload ArrayBuffer is transferred to the main
 * thread by reference.
 *
 */

import { Worker, isMainThread, parentPort } from "worker_threads";
import { fetch as undiciFetch } from "undici";
import diagnosticsChannel from "diagnostics_channel";
import config from "../config";

// Object for keeping track of pending requests
let pendingRequests;

// The worker thread
let worker;

// Counter for creating identifiers
let identifierCounter = 0;

// Header name that we use to attach identifier to a HTTP request
const INTERNAL_ID_HEADER = "X-internal-id";

/**
 * This is called from the main thread
 *
 * It will send job to the worker thread, and the
 * returned promise is resolved, when worker thread hands over
 * the undici fetch result
 */
export function fetch(url, options = {}) {
  const identifier = identifierCounter++;

  if (!options.headers) {
    options.headers = {};
  }

  // Set the custom internal header that holds the identifer
  options.headers[INTERNAL_ID_HEADER] = identifier;

  return new Promise((resolve, reject) => {
    // Store the resolve and reject functions with the identifier
    pendingRequests[identifier] = { resolve, reject };

    // Sending a message to the worker thread to initiate the fetch
    worker.postMessage({ url, options, identifier });
  });
}

// Setup things running on the main thread
if (isMainThread) {
  // Init pedning requests object
  pendingRequests = {};

  // Init worker thread
  worker = new Worker(__filename);

  // Listening for messages from the worker thread
  worker.on("message", (obj) => {
    // Lookup pending request, and resolve it with the object
    // sent from the worker thread.
    // This will resolve a promise created in the fetch function
    pendingRequests[obj.identifier].resolve(obj);

    // Clean up request
    delete pendingRequests[obj.identifier];
  });
}

// Setup things running on the worker thread
if (!isMainThread) {
  // Object for holding promise resolve functions
  // A resolve is called when all timings have been collected for a request
  const pendingTimingCallbacks = {};

  // This message is published when a new outgoing request is created.
  diagnosticsChannel
    .channel("undici:request:create")
    .subscribe(({ request }) => {
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
  diagnosticsChannel.channel("undici:request:trailers").subscribe((arg) => {
    const { request } = arg;
    const now = performance.now();
    const total = now - request.timings.create;

    // Get identifer from custom header
    const identifier = parseInt(
      request.headers
        .split("\r\n")
        .find((header) => header.startsWith(INTERNAL_ID_HEADER))
        ?.replace?.(`${INTERNAL_ID_HEADER}: `, "") || -1
    );

    // Call resolve with collected timings
    pendingTimingCallbacks[identifier]?.({
      origin: request.origin,
      connectionStart: request.timings.sendHeaders - request.timings.create,
      requestSent: request.timings.bodySent - request.timings.sendHeaders,
      waitingForServerResponse:
        request.timings.headers - request.timings.bodySent,
      contentDownload: now - request.timings.headers,
      total,
    });
  });

  // A proxy dispatcher, used for fetch requests
  // that must go through the proxy
  const proxyDispatcher = config.dmzproxy.url
    ? new ProxyAgent(config.dmzproxy.url)
    : null;

  // Listening for messages from the main thread
  parentPort.on("message", async ({ url, options, identifier }) => {
    const startTime = performance.now();
    try {
      // Create timings promise
      const timingsPromise = new Promise((resolve) => {
        pendingTimingCallbacks[identifier] = resolve;
      });

      const enableProxy = options.enableProxy;
      delete options.enableProxy;

      // Set proxy if required
      if (enableProxy && proxyDispatcher) {
        options.dispatcher = proxyDispatcher;
      }

      const res = await undiciFetch(url, options);

      // The buffer is transferrable between main thread and worker thread
      // by reference, i.e. it is much faster than posting a string
      const buffer = await res.arrayBuffer();

      // Get the timings for this request
      const timingsRes = await timingsPromise;

      // Post the message back to the main thread
      parentPort.postMessage(
        {
          status: res.status,
          ok: res.ok,
          identifier,
          buffer,
          timings: { ...timingsRes, bytes: buffer.byteLength },
        },
        [buffer]
      );
    } catch (e) {
      // Some network error happened
      // We still need to post back a message
      parentPort.postMessage({
        identifier,
        status: e?.cause?.code,
        body: null,
        ok: false,
        timings: { total: performance.now() - startTime },
      });
    } finally {
      // Always clean up
      delete pendingTimingCallbacks[identifier];
    }
  });
}
