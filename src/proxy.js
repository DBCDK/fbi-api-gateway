const express = require("express");
const http = require("http");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { log } = require("dbc-node-logger");

const app = express();

const docsProxy = createProxyMiddleware("http://127.0.0.1:3001", {
  changeOrigin: true,
  ws: true,
  logLevel: "silent",
});

const testUserLoginProxy = createProxyMiddleware("http://127.0.0.1:3002", {
  changeOrigin: true,
  ws: true,
  logLevel: "silent",
});

// Socket path for the GraphQL Express server
const SOCKET_PATH = "/tmp/child.sock";

// Count of 503s when the GraphQL child could not be reached (sent to child on each request).
let childUnavailableCount = 0;

/**
 * This is a reverse proxy that forwards requests to the GraphQL server over a Unix socket.
 * It adds `x-timestamp` (when the request hit the proxy) and `x-unavailable-count`
 * (how often the proxy could not reach the server) for timing and monitoring in GraphQL.
 */
function graphQLProxy(req, res) {
  const options = {
    socketPath: SOCKET_PATH,
    path: req.originalUrl,
    method: req.method,
    headers: {
      ...req.headers,
      "x-timestamp": Date.now(),
      "x-unavailable-count": String(childUnavailableCount),
    },
  };

  let proxy;
  let settled = false;

  /**
   * GraphQL child server unreachable or upstream stream failed: 503, bump counter, log.
   * Uses `settled` so a follow-up `error` from `destroy()` does not double-count.
   */
  const unavailable = (err, phase) => {
    if (settled) return;
    settled = true;
    childUnavailableCount += 1;
    log.error("GraphQL proxy: child unavailable", {
      phase,
      path: req.originalUrl,
      code: err.code,
      error: String(err),
    });
    if (!res.headersSent) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Service unavailable" }));
    } else {
      res.destroy();
    }
    proxy.destroy();
  };

  /**
   * Client went away (reset, abort, etc.): tear down the outgoing request only.
   * It is not a child failure, so no 503 and no counter.
   */
  const drop = () => {
    if (settled) return;
    settled = true;
    proxy.destroy();
  };

  proxy = http.request(options, (proxyRes) => {
    proxyRes.on("error", (err) => unavailable(err, "upstream"));
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.on("data", (chunk) => res.write(chunk));
    proxyRes.on("end", () => res.end());
  });

  proxy.on("error", (err) => unavailable(err, "connect"));

  res.on("error", drop);
  req.on("error", drop);
  req.on("aborted", drop);
  req.on("close", () => {
    if (!req.readableEnded) drop();
  });

  req.pipe(proxy);
}

app.use(cors());

// trust ip-addresses from X-Forwarded-By header, and log requests
app.enable("trust proxy");

app.use("/:profile/graphql", graphQLProxy);
app.use("/:agencyId/:profile/graphql", graphQLProxy);
app.use("/howru", graphQLProxy);
app.use("/complexity", graphQLProxy);
app.use("/metrics", graphQLProxy);

// Proxy to test user login website
app.use("/test", testUserLoginProxy);

// Proxy to docs website
app.use(docsProxy);

const port = 3000;
app.listen(port, () => {
  log.info(`Running Proxy at http://localhost:${port}`);
});
