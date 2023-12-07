/**
 * @file Setting up a GraphQL server using Express
 *
 */
import { log } from "dbc-node-logger";
import { getExecutableSchema } from "./schemaLoader";
import express from "express";
import request from "superagent";

import createHash from "./utils/hash";

import { createProxyMiddleware } from "http-proxy-middleware";

import cors from "cors";
//
import { createHandler } from "graphql-http/lib/use/express";
//
import { parse, getOperationAST } from "graphql";
import config from "./config";
import howruHandler from "./howru";
import { metrics, observeDuration } from "./utils/monitor";
import {
  validateQueryComplexity,
  getQueryComplexity,
} from "./utils/complexity";
import createDataLoaders from "./datasourceLoader";

import { v4 as uuid } from "uuid";
import isbot from "isbot";
import { parseTestToken } from "./utils/testUserStore";
import isFastLaneQuery, {
  fastLaneMiddleware,
  getFastLane,
} from "./utils/fastLane";

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

const proxy = createProxyMiddleware("http://127.0.0.1:3001", {
  changeOrigin: true,
  ws: true,
  logLevel: "silent",
});

const testUserLoginProxy = createProxyMiddleware("http://127.0.0.1:3002", {
  changeOrigin: true,
  ws: true,
  logLevel: "silent",
});

const promExporterApp = express();
// Setup route handler for metrics
promExporterApp.get("/metrics", metrics);
promExporterApp.listen(9599, () => {
  log.info(`Running metrics endpoint at http://localhost:9599/metrics`);
});

(async () => {
  app.use(cors());
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

  app.post("/:profile/graphql", fastLaneMiddleware);

  // Middleware that monitors performance of those GraphQL queries
  // which specify a monitor name.
  app.post("/:profile/graphql", async (req, res, next) => {
    const start = process.hrtime();
    res.once("finish", () => {
      const elapsed = process.hrtime(start);
      const seconds = elapsed[0] + elapsed[1] / 1e9;

      // Convert variables to strings, to make sure there are no type conflicts,
      // when log is indexed
      let queryVariables = {};
      if (req.queryVariables) {
        Object.entries(req.queryVariables).forEach(
          ([key, val]) =>
            (queryVariables[key] =
              typeof val === "string" ? val : JSON.stringify(val))
        );
      }

      const userAgent = req.get("User-Agent");

      const accessTokenHash = createHash(req.accessToken);

      // detailed logging for SLA
      log.info("TRACK", {
        clientId: req?.smaug?.app?.clientId,
        uuid: req?.datasources?.stats.uuid,
        parsedQuery: req.parsedQuery,
        queryVariables,
        datasources: req.datasources.stats.summary(),
        profile: req.profile,
        total_ms: Math.round(seconds * 1000),
        queryComplexity: req.queryComplexity,
        isIntrospectionQuery: req.isIntrospectionQuery,
        graphQLErrors: req.graphQLErrors && JSON.stringify(req.graphQLErrors),
        userAgent,
        userAgentIsBot: isbot(userAgent),
        ip: req?.smaug?.app?.ips?.[0],
        isAuthenticatedToken: !!req.user?.userId,
        hasUniqueId: !!req.user?.uniqueId,
        accessTokenHash,
        isTestToken: req.isTestToken,
        fastLane: req.fastLane,
      });
      // monitorName is added to context/req in the monitor resolver
      if (req.monitorName) {
        observeDuration(req.monitorName, seconds);
      }
    });
    next();
  });

  /**
   * Middleware for parsing access token
   */
  app.post("/:profile/graphql", async (req, res, next) => {
    // Get bearer token from authorization header
    req.rawAccessToken = req.headers.authorization?.replace(/bearer /i, "");
    req.isTestToken = req.rawAccessToken?.startsWith("test");
    if (req.isTestToken) {
      // Using a test token will automatically mock certain datasources
      // making it possible to have test users
      const testToken = parseTestToken(req.rawAccessToken);
      req.testUser = testToken.testUser;
      req.accessToken = testToken.accessToken;
    } else {
      req.accessToken = req.rawAccessToken;
    }

    next();
  });

  /**
   * Middleware for initializing dataloaders
   */
  app.post("/:profile/graphql", async (req, res, next) => {
    req.datasources = createDataLoaders(uuid(), req.testUser, req.accessToken);
    next();
  });

  /**
   * Middleware for validating access token, and fetching smaug configuration
   */
  app.post("/:profile/graphql", async (req, res, next) => {
    // Get graphQL params
    try {
      const graphQLParams = req.body;
      const document = parse(graphQLParams.query);
      const ast = getOperationAST(document);
      req.queryVariables = graphQLParams.variables;
      req.parsedQuery = graphQLParams.query
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ");
      req.queryDocument = document;

      // Check if query is introspection query
      req.isIntrospectionQuery = isIntrospectionQuery(ast);
    } catch (e) {}

    // Fetch Smaug client configuration
    try {
      req.smaug =
        req.accessToken &&
        (await req.datasources.getLoader("smaug").load({
          accessToken: req.accessToken,
        }));
      req.smaug.app.ips = (req.ips.length && req.ips) || [req.ip];

      // Agency of the smaug client
      const agency = req.smaug?.agencyId;

      req.profile = {
        agency,
        name: req.params.profile,
        combined: `${agency}/${req.params.profile}`,
      };
    } catch (e) {
      if (e.response && e.response.statusCode !== 404) {
        log.error("Error fetching from smaug", { response: e });
        res.status(500);
        return res.send({
          statusCode: 500,
          message: "Internal server error",
        });
      }
    }

    // If query is introspection, we allow access even though
    // No token is given
    if (!req.isIntrospectionQuery) {
      // Invalid access token
      if (!req.smaug) {
        res.status(403);
        return res.send({
          statusCode: 403,
          message: "Unauthorized",
        });
      }

      // Access token is valid, but client is not configured properly
      if (!req.profile?.agency) {
        log.error(
          `Missing agency in configuration for client ${req.smaug?.app?.clientId}`
        );
        res.status(403);
        return res.send({
          statusCode: 403,
          message:
            "Invalid client configuration. Missing agency in configuration for client.",
        });
      }
    }

    next();
  });

  /**
   * Middleware for fetching user information (for authenticated tokens)
   */
  app.post("/:profile/graphql", async (req, res, next) => {
    // Fetch login.bib.dk userinfo
    try {
      const userinfo =
        req.accessToken &&
        (await req.datasources.getLoader("userinfo").load({
          accessToken: req.accessToken,
        }));

      req.user = userinfo?.attributes || null;
    } catch (e) {
      log.error("Error fetching from userinfo", { response: e });
      res.status(500);
      return res.send({
        statusCode: 500,
        message: "Internal server error",
      });
    }

    next();
  });

  /**
   * Check if operation is introspection
   * @param {*} operation
   * @returns
   */
  function isIntrospectionQuery(operation) {
    return operation.selectionSet.selections.every((selection) => {
      const fieldName = selection.name.value;
      return fieldName.startsWith("__");
    });
  }

  // Query complexity middleware
  app.post("/:profile/graphql", async (req, res) => {
    const schema = await getExecutableSchema({
      clientPermissions: req?.smaug?.gateway,
      hasAccessToken: !!req.accessToken,
    });

    const { query, variables } = req.body;

    // Set incomming query complexity
    req.queryComplexity = getQueryComplexity({ query, variables, schema });

    // check if the query allows for fast lane
    req.fastLane =
      !req.isIntrospectionQuery && isFastLaneQuery(req.queryDocument, schema);

    if (req.fastLane) {
      req.fastLaneKey = JSON.stringify({
        query,
        variables,
        profile: req.profile,
      });
      const fastLaneRes = await getFastLane(
        req.fastLaneKey,
        req.datasources.stats
      );
      if (fastLaneRes) {
        return res.send(fastLaneRes);
      }
    }

    const handler = createHandler({
      schema,
      validationRules: [validateQueryComplexity({ query, variables })],
      context: req,
    });

    return handler(req, res);
  });

  // Setup route handler for howru - triggers an alert in prod
  app.get("/howru", howruHandler);

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
      clientPermissions,
      hasAccessToken: !!(clientPermissions && token),
    });

    // // Set incomming query complexity
    const queryComplexity = getQueryComplexity({
      query,
      variables,
      schema,
    });

    res.send({ complexity: queryComplexity });
  });

  // Proxy to test user login website
  app.use("/test", testUserLoginProxy);

  // Proxy to docs website
  app.use(proxy);

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

  server = app.listen(config.port, () => {
    log.info(`Running GraphQL API at http://localhost:${config.port}/graphql`);
  });
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
