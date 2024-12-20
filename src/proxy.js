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

function graphQLProxy(req, res) {
  const options = {
    socketPath: SOCKET_PATH,
    path: req.originalUrl,
    method: req.method,
    headers: {
      ...req.headers,
      "x-timestamp": Date.now(),
    },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    proxyRes.on("data", (chunk) => res.write(chunk));
    proxyRes.on("end", () => res.end());
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
