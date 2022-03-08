/**
 * @file Setting up a GraphQL server using Express
 *
 */
import { log } from "dbc-node-logger";
import { getExecutableSchema } from "./schemaLoader";
import express from "express";

import { createProxyMiddleware } from "http-proxy-middleware";

import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import { parse, getOperationAST, print } from "graphql";
import config from "./config";
import howruHandler from "./howru";
import { metrics, observeDuration, count } from "./utils/monitor";
import validateComplexity from "./utils/complexity";
import createDataLoaders from "./datasourceLoader";
import { wrapResolvers } from "./utils/wrapResolvers";
import { uuid } from "uuidv4";

const app = express();
let server;

const proxy = createProxyMiddleware("http://localhost:3001", {
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
  // Middleware that monitors performance of those GraphQL queries
  // which specify a monitor name.
  app.use("/graphql", async (req, res, next) => {
    const start = process.hrtime();
    res.once("finish", () => {
      const elapsed = process.hrtime(start);
      const seconds = elapsed[0] + elapsed[1] / 1e9;
      // detailed logging for SLA
      log.info("TRACK", {
        clientId: req?.smaug?.app?.clientId,
        uuid: req?.datasources?.trackingObject.uuid,
        parsedQuery: req.parsedQuery,
        datasources: { ...req?.datasources?.trackingObject?.trackObject },
        total: Math.round(seconds * 1000),
      });
      // monitorName is added to context/req in the monitor resolver
      if (req.monitorName) {
        observeDuration(req.monitorName, seconds);
      }
    });
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

  // Setup route handler for GraphQL
  app.use(
    "/graphql",
    graphqlHTTP(async (request, response, graphQLParams) => {
      // Create dataloaders and add to request
      request.datasources = createDataLoaders(uuid());

      // Get bearer token from authorization header
      request.accessToken =
        request.headers.authorization &&
        request.headers.authorization.replace(/bearer /i, "");

      // Fetch smaug configuration
      try {
        request.smaug =
          request.accessToken &&
          (await request.datasources.smaug.load({
            accessToken: request.accessToken,
          }));
        request.smaug.app.ips = (request.ips.length && request.ips) || [
          request.ip,
        ];
      } catch (e) {
        if (e.response && e.response.statusCode !== 404) {
          log.error("Error fetching from smaug", { response: e });
          throw "Internal server error";
        }
      }

      return {
        schema: await getExecutableSchema({
          clientPermissions: request?.smaug?.gateway,
        }),
        // graphiql: { headerEditorEnabled: true, shouldPersistHeaders: true },
        extensions: ({ document, context, result }) => {
          if (document && document.definitions && !result.errors) {
            count("query_success");
          } else {
            count("query_error");
            result.errors.forEach((error) => {
              log.error(error.message);
            });
          }
          request.parsedQuery = print(document);
        },
        validationRules: [
          function authenticate() {
            if (request.method === "GET") {
              throw "Unauthorized";
            }

            const document = parse(graphQLParams.query);
            const ast = getOperationAST(document);

            // If this is not the introspection query,
            // a valid token is required
            if (!request.smaug && !isIntrospectionQuery(ast)) {
              throw "Unauthorized";
            }

            // All ok
            return { Field() {} };
          },
          validateComplexity({
            query: graphQLParams.query,
            variables: graphQLParams.variables,
          }),
        ],
      };
    })
  );

  // route handler for livelinessprobe
  // app.get("/", function (req, res) {
  //   res.send("hello world");
  // });
  // Setup route handler for howru - triggers an alert in prod
  app.get("/howru", howruHandler);

  app.use(proxy);

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
