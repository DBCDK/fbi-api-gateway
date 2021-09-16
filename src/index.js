/**
 * @file Setting up a GraphQL server using Express
 *
 */
import { log } from "dbc-node-logger";
import schema from "./schemaLoader";
import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import config from "./config";
import howruHandler from "./howru";
import { metrics, observeDuration, count } from "./utils/monitor";
import validateComplexity from "./utils/complexity";
import createDataLoaders from "./datasourceLoader";

const app = express();
let server;

const promExporterApp = express();
// Setup route handler for metrics
promExporterApp.get("/metrics", metrics);
promExporterApp.listen(9599, () => {
  log.info(`Running metrics endpoint at http://localhost:9599/metrics`);
});

(async () => {
  app.use(cors());

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

  // Middleware that monitors performance of those GraphQL queries
  // which specify a monitor name.
  app.use(async (req, res, next) => {
    const start = process.hrtime();
    res.once("finish", () => {
      // monitorName is added to context/req in the monitor resolver
      if (req.monitorName) {
        const elapsed = process.hrtime(start);
        const seconds = elapsed[0] + elapsed[1] / 1e9;
        observeDuration(req.monitorName, seconds);
      }
    });
    next();
  });

  // set up context per request
  app.use(async (req, res, next) => {
    req.datasources = createDataLoaders();

    // Get bearer token from authorization header
    req.accessToken =
      req.headers.authorization &&
      req.headers.authorization.replace(/bearer /i, "");

    // Bearer token is required
    if (!req.accessToken) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    // And bearer token must be valid
    try {
      req.smaug = await req.datasources.smaug.load({
        accessToken: req.accessToken,
      });
    } catch (e) {
      if (e.response && e.response.statusCode === 404) {
        return res.status(401).send({ error: "Unauthorized" });
      }
      log.error("Error fetching from smaug", { response: e });
      return res.status(500).send({ error: "Internal server error" });
    }

    next();
  });

  let resolvedSchema;
  (async () => {
    try {
      resolvedSchema = await schema();
    } catch (e) {
      log.error("Could not create schema, shutting down", e);
      process.exit(1);
    }
  })();
  // Setup route handler for GraphQL
  app.use(
    "/graphql",
    graphqlHTTP(async (request, response, graphQLParams) => ({
      schema: resolvedSchema,
      graphiql: { headerEditorEnabled: true, shouldPersistHeaders: true },
      extensions: ({ document, context, result }) => {
        if (document && document.definitions && !result.errors) {
          count("query_success");
        } else {
          count("query_error");
          result.errors.forEach((error) => {
            log.error(error.message, error);
          });
        }
      },
      validationRules: [
        validateComplexity({
          query: graphQLParams.query,
          variables: graphQLParams.variables,
        }),
      ],
    }))
  );

  // Setup route handler for howru
  app.get("/howru", howruHandler);

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
