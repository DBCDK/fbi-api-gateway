/**
 * @file Setting up a GraphQL server using Express
 *
 */
import fs from "fs";
import { log } from "dbc-node-logger";
import { getExecutableSchema } from "./schemaLoader";
import express from "express";
import request from "superagent";
import config from "./config";
import howruHandler from "./howru";
import metricsHandler from "./metrics";


import { metrics } from "./utils/monitor";
import {
  getQueryComplexity,
  getQueryComplexityClass,
} from "./utils/complexity";
import { performanceTracker } from "./middlewares/track";
import { start as startResourceMonitor } from "./utils/resourceMonitor";
import { dataCollectMiddleware } from "./utils/dataCollect";
import { parseToken } from "./middlewares/parseToken";
import { initDataloaders } from "./middlewares/dataloaders";
import { validateToken } from "./middlewares/validateToken";
import { fetchUserInfo } from "./middlewares/fetchUserInfo";
import { validateDepth } from "./middlewares/validateQueryDepth";
import { resolveGraphQLQuery } from "./middlewares/resolveGraphQLQuery";
import { validateAgencyId } from "./middlewares/validateAgencyId";
import { dataHubMiddleware } from "./middlewares/dataHubMiddleware";

// this is a quick-fix for macOS users, who get an EPIPE error when starting fbi-api
process.stdout.on("error", function (err) {
  if (err.code == "EPIPE") {
    process.exit(0);
  }
  if (err.code == "ECONNRESET") {
    process.exit(0);
  }
});

const app = express();
let server;

const promExporterApp = express();
// Setup route handler for metrics
promExporterApp.get("/metrics", metrics);
promExporterApp.listen(9599, () => {
  log.info(`Running metrics endpoint at http://localhost:9599/metrics`);
});

(async () => {
  // Set limit on body size
  app.use(express.json({ limit: 10000 }));

  // trust ip-addresses from X-Forwarded-By header, and log requests
  app.enable("trust proxy");

  // Middleware for replacing certain characters in response body.
  // This is a quick fix, and may be removed again if it is solved elsewhere.
  app.use(function (req, res, next) {
    var originalSend = res.send;
    res.send = function () {
      if (arguments[0] && arguments[0].replace) {
        arguments[0] = arguments[0].replace(/ꜳ/g, "aa").replace(/Ꜳ/g, "Aa");
      }
      originalSend.apply(res, arguments);
    };
    next();
  });

  app.post("/:profile/graphql", [
    performanceTracker,
    parseToken,
    dataCollectMiddleware,
    dataHubMiddleware,
    initDataloaders,
    validateToken,
    validateAgencyId,
    fetchUserInfo,
    validateDepth,
    resolveGraphQLQuery,
  ]);

  app.post("/:agencyId/:profile/graphql", [
    performanceTracker,
    parseToken,
    dataCollectMiddleware,
    dataHubMiddleware,
    initDataloaders,
    validateToken,
    validateAgencyId,
    fetchUserInfo,
    validateDepth,
    resolveGraphQLQuery,
  ]);

  // Setup route handler for howru - triggers an alert in prod
  app.get("/howru", howruHandler);

  // Setup route handler for howru - triggers an alert in prod
  app.get("/metrics", metricsHandler);
  /**
   * Query complexity endpoint
   * POST request
   * token set as bearer header (Not required)
   * query {string} and variables {string} set as body params.
   */
  app.post("/complexity", async (req, res) => {
    // get AccessToken from header
    const token = req.headers.authorization?.replace(/bearer /i, "");

    // Get body params
    const { query, variables } = req.body;

    // Get client permissions from smuag
    let clientPermissions;
    try {
      const url = config.datasources.smaug.url;
      const smaug = (
        await request.get(`${url}/configuration`).query({
          token,
        })
      ).body;

      // Set token client permissions
      clientPermissions = smaug?.gateway;
    } catch (e) {
      // No valid accessToken - fallbacks to default schema (introspect)
    }

    const schema = await getExecutableSchema({
      clientPermissions: { gateway: { ...clientPermissions } },
      hasAccessToken: !!(clientPermissions && token),
    });

    // // Set incomming query complexity
    const queryComplexity = getQueryComplexity({
      query,
      variables,
      schema,
    });

    // Get query complexity class (simple|complex|critical|rejected)
    const complexityClass = getQueryComplexityClass(queryComplexity);

    res.send({ complexity: queryComplexity, complexityClass });
  });

  // Default error handler
  app.use((error, request, response, next) => {
    if (error) {
      log.error(String(error), {
        error: String(error),
        stacktrace: error.stack,
      });
      response.status(500).send({ error: "Internal server error" });
    } else {
      next();
    }
  });

  const SOCKET_PATH = "/tmp/child.sock";

  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }
  server = app.listen(SOCKET_PATH, () => {
    log.info(`Running GraphQL API at http://localhost:${config.port}/graphql`);
  });
  server.on("connection", (socket) => {
    socket.socketInit = performance.now();
  });

  server.on("request", (req, res) => {
    if (typeof req.socket.count !== "number") {
      req.socket.count = 0;
    }
    req.socket.count++;
    req.requestStart =
      req.socket.count === 1 ? req.socket.socketInit : performance.now();
  });

  startResourceMonitor(server);
})();

const signals = {
  SIGINT: 2,
  SIGTERM: 15,
};

function shutdown(signal, value) {
  server.close(function () {
    log.info(`server stopped by ${signal}`);
    process.exit(128 + value);
  });
}

Object.keys(signals).forEach(function (signal) {
  process.on(signal, function () {
    shutdown(signal, signals[signal]);
  });
});
